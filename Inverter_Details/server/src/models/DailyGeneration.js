const mongoose = require('mongoose');
const { Schema } = mongoose;

const dailyGenerationSchema = new Schema({
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    date: {
        type: Date,
        required: true,
        // Ensure date is stored as UTC Midnight
        set: (d) => {
            const date = new Date(d);
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        }
    },
    dailyGeneration: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Site Publish', 'Send to HQ Approval', 'HQ Approved', 'Site Hold'],
        default: 'Draft'
    }
}, { timestamps: true });

// Performance Optimization: Unique Compound Index prevents duplicates and enables fast range queries
dailyGenerationSchema.index({ site: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyGeneration', dailyGenerationSchema);
