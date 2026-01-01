const mongoose = require('mongoose');
const { Schema } = mongoose;

const meterSchema = new Schema({
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    plantStartTime: {
        type: String,
        required: true
    },
    plantStopTime: {
        type: String,
        default: '00:00'
    },
    total: {
        type: String,
        default: '00:00'
    },
    activeEnergyImport: {
        type: Number,
        default: 0
    },
    activeEnergyExport: {
        type: Number,
        default: 0
    },
    reactiveEnergyImport: {
        type: Number,
        default: 0
    },
    reactiveEnergyExport: {
        type: Number,
        default: 0
    },
    voltage: {
        type: Number,
        default: 0
    },
    current: {
        type: Number,
        default: 0
    },
    frequency: {
        type: Number,
        default: 0
    },
    powerFactor: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: 'Draft'
    }
}, { timestamps: true });

// Prevent duplicate entries for the same date+time
meterSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Meter', meterSchema);
