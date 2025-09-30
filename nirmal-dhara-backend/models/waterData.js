const mongoose = require('mongoose');

const WaterDataSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        unique: false,
    },
    fecal_coliform: { type: Number, default: 500 },
    flow: { type: Number, default: 1400 },
    nitrate: { type: Number, default: 5.5 },
    rainfall: { type: Number, default: 10 },
    temperature: { type: Number, default: 23 },
    water_level: { type: Number, default: 70.5 },
    bod: { type: Number, default: 2.5 }, // Biochemical Oxygen Demand (mg/L)
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('WaterData', WaterDataSchema);