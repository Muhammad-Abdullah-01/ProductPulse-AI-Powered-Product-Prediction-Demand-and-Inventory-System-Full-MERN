const path         = require('path');
const fs           = require('fs');
const Upload       = require('../models/Upload');
const SalesRecord  = require('../models/SalesRecord');
const Alert        = require('../models/Alert');
const { parseFile }       = require('../services/fileParser');
const { batchForecast, aggregateForecast } = require('../services/predictionService');

// POST /api/uploads
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { file } = req;

    // 1. Create Upload document in DB
    const uploadDoc = await Upload.create({
      uploadedBy:   req.user._id,
      fileName:     file.filename,
      originalName: file.originalname,
      fileSize:     file.size,
      mimeType:     file.mimetype,
      filePath:     file.path,
      status:       'processing',
    });

    // 2. Parse the file asynchronously (we return immediately so UI can poll)
    // For simplicity and reliability, we process synchronously but respond fast
    processUpload(uploadDoc._id, file, req.user._id).catch(err => {
      console.error('Upload processing error:', err);
    });

    res.status(202).json({
      success: true,
      message: 'File received. Processing started.',
      uploadId: uploadDoc._id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Background processing: parse → validate → save records → run AI → create alerts
 */
async function processUpload(uploadId, file, userId) {
  try {
    // ── Parse ──────────────────────────────────────────────────────────────
    const parsed = await parseFile(file.path, file.mimetype);

    // ── Save SalesRecords ──────────────────────────────────────────────────
    const docs = parsed.rows.map(row => ({
      ...row,
      uploadedBy: userId,
      uploadId:   uploadId,
    }));

    let salesRecords = [];
    if (docs.length > 0) {
      salesRecords = await SalesRecord.insertMany(docs, { ordered: false });
    }

    // ── Run AI predictions ─────────────────────────────────────────────────
    const stockMap = {};
    for (const r of salesRecords) {
      if (r.stock !== null) stockMap[r.productId] = r.stock;
    }

    const predictions = batchForecast(salesRecords, stockMap);
    const totalForecast  = aggregateForecast(predictions);
    const criticalCount  = predictions.filter(p => p.severity === 'critical').length;
    const warningCount   = predictions.filter(p => p.severity === 'warning').length;
    const avgConfidence  = predictions.length
      ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
      : 0;

    // ── Update SalesRecords with AI results ────────────────────────────────
    const bulkOps = predictions.map(p => ({
      updateMany: {
        filter: { productId: p.productId, uploadId },
        update: {
          $set: {
            forecastedDemand: p.forecastedDemand,
            stockRisk:        p.severity,
            restockDate:      p.shortageDateISO,
          },
        },
      },
    }));
    if (bulkOps.length > 0) await SalesRecord.bulkWrite(bulkOps);

    // ── Create / update Alerts ─────────────────────────────────────────────
    const alertDocs = predictions
      .filter(p => p.severity !== 'stable')
      .map(p => ({
        createdBy:    userId,
        product:      p.productName,
        productId:    p.productId,
        category:     p.category,
        region:       p.region,
        stockStatus:  p.stockStatus,
        severity:     p.severity,
        stock:        p.currentStock,
        required:     p.reorderPoint,
        shortageDate: p.shortageDate,
        shortageDateISO: p.shortageDateISO,
        action:       p.action,
        isActive:     true,
      }));

    if (alertDocs.length > 0) {
      await Alert.insertMany(alertDocs, { ordered: false });
    }

    // ── Finalise Upload record ─────────────────────────────────────────────
    await Upload.findByIdAndUpdate(uploadId, {
      status:       'completed',
      rowsTotal:    parsed.rowsTotal,
      rowsImported: parsed.rowsImported,
      rowsFailed:   parsed.rowsFailed,
      validationWarnings: parsed.validationWarnings,
      predictionSummary: {
        forecastedDemand: totalForecast,
        criticalAlerts:   criticalCount,
        warningAlerts:    warningCount,
        modelConfidence:  avgConfidence,
      },
      processedAt: new Date(),
    });
  } catch (err) {
    console.error('processUpload failed:', err);
    await Upload.findByIdAndUpdate(uploadId, {
      status:       'failed',
      errorMessage: err.message,
    });
  }
}

// GET /api/uploads/:id/status
exports.getUploadStatus = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!upload) return res.status(404).json({ success: false, message: 'Upload not found.' });

    res.json({ success: true, upload });
  } catch (err) {
    next(err);
  }
};

// GET /api/uploads  — list all uploads for the user
exports.listUploads = async (req, res, next) => {
  try {
    const uploads = await Upload.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-filePath');

    res.json({ success: true, count: uploads.length, uploads });
  } catch (err) {
    next(err);
  }
};

// GET /api/uploads/:id/preview  — first 10 rows of an upload
exports.getUploadPreview = async (req, res, next) => {
  try {
    const rows = await SalesRecord.find({ uploadId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(10)
      .select('productId productName category region sales month');

    res.json({ success: true, rows });
  } catch (err) {
    next(err);
  }
};
