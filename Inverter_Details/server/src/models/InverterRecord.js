const mongoose = require('mongoose');

const inverterRecordSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: 'Draft'
    },
    // Dynamic inverter values stored as a Map
    inverterValues: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
inverterRecordSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('InverterRecord', inverterRecordSchema);
