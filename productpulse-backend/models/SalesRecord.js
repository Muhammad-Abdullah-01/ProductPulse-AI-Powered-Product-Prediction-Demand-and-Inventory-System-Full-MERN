const mongoose = require('mongoose');

// Each row in an uploaded CSV/XLSX becomes one SalesRecord
const salesRecordSchema = new mongoose.Schema(
  {
    // Uploaded by which user
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', required: true },

    // Core fields (match the previewData columns in UploadData.js)
    productId:   { type: String, required: true, index: true },
    productName: { type: String, required: true },
    category:    {
      type: String,
      enum: ['Electronics', 'Fashion', 'Groceries', 'Sports', 'Beauty', 'Home & Garden', 'Appliances', 'Other'],
      default: 'Other',
    },
    region:  { type: String, enum: ['North', 'South', 'East', 'West', 'Unknown'], default: 'Unknown' },
    sales:   { type: Number, required: true, min: 0 },
    month:   { type: String, required: true },   // e.g. "Mar 2025"
    date:    { type: Date,   required: true },   // parsed from month for sorting

    // Optional enrichment
    stock:    { type: Number, default: null },
    price:    { type: Number, default: null },
    cost:     { type: Number, default: null },
    profit:   { type: Number, default: null },
    gender:   { type: String, enum: ['Male', 'Female', 'Other', null], default: null },

    // Computed by AI service after upload
    forecastedDemand: { type: Number, default: null },
    stockRisk:        { type: String, enum: ['critical', 'warning', 'stable', null], default: null },
    restockDate:      { type: Date,   default: null },
  },
  { timestamps: true }
);

salesRecordSchema.index({ category: 1, region: 1, date: -1 });
salesRecordSchema.index({ uploadedBy: 1, date: -1 });
salesRecordSchema.index({ gender: 1, category: 1 });

module.exports = mongoose.model('SalesRecord', salesRecordSchema);
