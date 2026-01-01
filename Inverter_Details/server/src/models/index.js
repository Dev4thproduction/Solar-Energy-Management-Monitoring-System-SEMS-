// Consolidated Models Export
// This file exports all models from the unified database

const InverterRecord = require('./InverterRecord');
const Weather = require('./Weather');
const Meter = require('./Meter');
const Site = require('./Site');
const BuildGeneration = require('./BuildGeneration');
const DailyGeneration = require('./DailyGeneration');
const MonthlyGeneration = require('./MonthlyGeneration');
const Alert = require('./Alert');
const User = require('./User');

module.exports = {
    // Inverter Models
    InverterRecord,

    // Weather Models
    Weather,

    // Meter Models
    Meter,

    // Solar Power Models
    Site,
    BuildGeneration,
    DailyGeneration,
    MonthlyGeneration,
    Alert,
    User
};
