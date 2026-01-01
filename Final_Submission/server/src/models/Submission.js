const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    site: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    invGen: {
        type: Number,
        required: true,
        default: 0
    },
    abtExport: {
        type: Number,
        required: true,
        default: 0
    },
    poa: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: 'Draft'
    },
    previousStatus: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: null
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient filtering
submissionSchema.index({ site: 1, date: 1 });

// Update timestamp before saving
submissionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Submission', submissionSchema);
