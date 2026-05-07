const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name:       { type: String, required: true },
    reportType: { type: String, enum: ['Monthly', 'Category', 'Inventory', 'Custom'], required: true },
    format:     { type: String, enum: ['pdf', 'excel'], required: true },
    dateRange:  {
      from: Date,
      to:   Date,
      label: String,     // "This Month", "Last 3 Months", "YTD", "Custom"
    },

    // Snapshot of key metrics at report time
    summary: {
      totalProfit:    Number,
      topCategory:    String,
      growthRegion:   String,
      riskPercent:    Number,
    },

    filePath:  { type: String, default: null },   // path to actual file on disk
    fileSize:  { type: Number, default: null },   // bytes
    status:    { type: String, enum: ['pending', 'generating', 'ready', 'failed'], default: 'pending' },
    errorMsg:  { type: String, default: null },
    readyAt:   { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
