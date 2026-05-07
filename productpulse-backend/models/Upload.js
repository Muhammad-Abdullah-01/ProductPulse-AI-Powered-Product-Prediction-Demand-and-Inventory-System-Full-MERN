const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName:     { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize:     { type: Number, required: true },   // bytes
    mimeType:     { type: String, required: true },
    filePath:     { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    rowsTotal:     { type: Number, default: 0 },
    rowsImported:  { type: Number, default: 0 },
    rowsFailed:    { type: Number, default: 0 },

    // Validation issues found during parsing
    validationWarnings: [
      {
        type:    { type: String, enum: ['error', 'warning', 'info'] },
        message: String,
        rows:    [Number],
      },
    ],

    // Summary of AI predictions run on this batch
    predictionSummary: {
      forecastedDemand: Number,
      criticalAlerts:   Number,
      warningAlerts:    Number,
      modelConfidence:  Number,
    },

    errorMessage: { type: String, default: null },
    processedAt:  { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
