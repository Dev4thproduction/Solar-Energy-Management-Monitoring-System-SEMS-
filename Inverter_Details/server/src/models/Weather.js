const mongoose = require('mongoose');
const { Schema } = mongoose;

const weatherSchema = new Schema({
    siteName: {
        type: String
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    poa: {
        type: Number,
        required: true,
        min: 0,
        max: 1500
    },
    ghi: {
        type: Number,
        required: true,
        min: 0,
        max: 1500
    },
    albedoUp: {
        type: Number,
        min: 0,
        max: 1500
    },
    albedoDown: {
        type: Number,
        min: 0,
        max: 1500
    },
    moduleTemp: {
        type: Number,
        required: true,
        min: 0
    },
    ambientTemp: {
        type: Number,
        required: true,
        min: 0
    },
    windSpeed: {
        type: Number,
        min: 0
    },
    rainfall: {
        type: Number,
        min: 0
    },
    humidity: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: 'Draft'
    }
}, { timestamps: true });

// Prevent duplicate date + time entries
weatherSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Weather', weatherSchema);
