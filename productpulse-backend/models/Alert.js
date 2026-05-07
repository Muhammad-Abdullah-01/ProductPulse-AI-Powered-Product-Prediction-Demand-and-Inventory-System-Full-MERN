const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    // Link to user and optionally to the sales record
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    salesRecord:{ type: mongoose.Schema.Types.ObjectId, ref: 'SalesRecord', default: null },

    product:     { type: String, required: true },
    productId:   { type: String, default: '' },
    category:    { type: String, required: true },
    region:      { type: String, required: true },

    stockStatus: { type: String, enum: ['Critical', 'Warning', 'Stable'], required: true },
    severity:    { type: String, enum: ['critical', 'warning', 'stable'], required: true },
    stock:       { type: Number, required: true },
    required:    { type: Number, default: 0 },

    shortageDate: { type: String, default: '—' },     // human-readable like "May 3"
    shortageDateISO: { type: Date, default: null },

    action: {
      type: String,
      enum: ['Reorder', 'Monitor', 'View Insights'],
      default: 'Monitor',
    },

    // Has a reorder been placed for this alert?
    reorderPlaced: { type: Boolean, default: false },
    reorderAt:     { type: Date,   default: null },

    // Is the alert still active or dismissed?
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

alertSchema.index({ createdBy: 1, severity: 1, isActive: 1 });
alertSchema.index({ category: 1, region: 1 });

module.exports = mongoose.model('Alert', alertSchema);
