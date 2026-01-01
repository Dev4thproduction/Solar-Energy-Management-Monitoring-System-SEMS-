# Date Format Standardization Guide

## Standard Date Format for All Applications

This project uses a **standardized date format** across all applications to ensure consistency and prevent integration issues.

---

## 📋 Quick Reference

| Context | Format | Example | Use Case |
|---------|--------|---------|----------|
| **Storage (MongoDB)** | Native Date at UTC midnight | `2025-07-15T00:00:00.000Z` | Database storage |
| **API Responses** | ISO 8601 (YYYY-MM-DD) | `2025-07-15` | JSON responses |
| **User Display** | DD-MM-YYYY | `15-07-2025` | Frontend UI |
| **API Input** | Accept both formats | `2025-07-15` or `15-07-2025` | API accepts flexible input |
| **Time (separate)** | HH:MM or HH:MM:SS | `14:30` or `14:30:45` | Time-only fields |

---

## 🎯 Core Principles

1. **Storage**: Always store dates as native JavaScript `Date` objects in MongoDB, normalized to UTC midnight
2. **API**: Always return dates in ISO 8601 format (YYYY-MM-DD)
3. **Display**: Always show dates to users in DD-MM-YYYY format
4. **Parsing**: Accept multiple input formats but normalize immediately

---

## 📦 Shared Date Utility Library

Location: `shared/dateUtils.js`

All applications should copy this file to their `utils/` directory.

### Available Functions

```javascript
const {
    parseDate,              // Parse any format → Date
    formatISO,              // Date → YYYY-MM-DD
    formatDDMMYYYY,         // Date → DD-MM-YYYY
    formatDDMMMYY,          // Date → DD-MMM-YY
    isValidDDMMYYYY,        // Validate DD-MM-YYYY
    getMonthName,           // Get month name
    getMonthNumber,         // Get month number (1-12)
    cloneDate               // Clone a date safely
} = require('./utils/dateUtils');
```

---

## 🔧 Implementation Guide

### 1. Backend (MongoDB Schema)

```javascript
const mongoose = require('mongoose');

const ExampleSchema = new mongoose.Schema({
    // Date-only field (recommended)
    date: {
        type: Date,
        required: true,
        set: (d) => {
            const date = new Date(d);
            // Normalize to UTC midnight
            return new Date(Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate()
            ));
        }
    },

    // Time-only field (separate from date)
    time: {
        type: String,
        required: false,
        match: /^\d{2}:\d{2}(:\d{2})?$/  // HH:MM or HH:MM:SS
    }
}, {
    timestamps: true  // Auto-creates createdAt, updatedAt
});

module.exports = mongoose.model('Example', ExampleSchema);
```

### 2. Backend (API Controllers)

```javascript
const { parseDate, formatISO } = require('./utils/dateUtils');

// GET endpoint - return ISO format
router.get('/api/records', async (req, res) => {
    const records = await Record.find();

    // Transform dates to ISO format for API response
    const response = records.map(record => ({
        ...record.toObject(),
        date: formatISO(record.date)  // 2025-07-15
    }));

    res.json(response);
});

// POST endpoint - accept flexible input
router.post('/api/records', async (req, res) => {
    const { date, ...otherFields } = req.body;

    // Parse date (accepts YYYY-MM-DD, DD-MM-YYYY, Excel serial, etc.)
    const parsedDate = parseDate(date);

    if (!parsedDate) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    const record = new Record({
        date: parsedDate,
        ...otherFields
    });

    await record.save();
    res.json({ ...record.toObject(), date: formatISO(record.date) });
});
```

### 3. Frontend (Display)

```javascript
import { formatDDMMYYYY, parseDate } from '../utils/dateUtils';

// Display date to user
function RecordRow({ record }) {
    return (
        <tr>
            <td>{formatDDMMYYYY(record.date)}</td>  {/* Shows: 15-07-2025 */}
            <td>{record.site}</td>
        </tr>
    );
}

// Parse user input
function DateInput({ onChange }) {
    const handleChange = (e) => {
        const userInput = e.target.value;  // User enters: 15-07-2025
        const parsed = parseDate(userInput);

        if (parsed) {
            onChange(formatISO(parsed));  // Send to API: 2025-07-15
        }
    };

    return <input type="text" onChange={handleChange} placeholder="DD-MM-YYYY" />;
}
```

### 4. Frontend (Input Fields)

```jsx
// For date input, use HTML5 date input (sends YYYY-MM-DD)
<input
    type="date"
    value={formatISO(date)}  // 2025-07-15
    onChange={(e) => setDate(parseDate(e.target.value))}
/>

// Display formatted date
<span>{formatDDMMYYYY(date)}</span>  // Shows: 15-07-2025
```

---

## 🔄 Migration Checklist

### For Each Application

- [ ] Copy `shared/dateUtils.js` to `{app}/server/src/utils/dateUtils.js`
- [ ] Update MongoDB schemas to use Date type with UTC setter
- [ ] Import shared utilities in route handlers
- [ ] Update API responses to use `formatISO()`
- [ ] Update API inputs to use `parseDate()`
- [ ] Update frontend to display using `formatDDMMYYYY()`
- [ ] Update frontend inputs to send using `formatISO()`
- [ ] Remove old date parsing logic
- [ ] Test cross-app date compatibility

---

## 📊 Application-Specific Notes

### Final Submission
- ✅ **Status**: Standardized
- **Storage**: Native Date (UTC midnight)
- **API**: Returns ISO format (YYYY-MM-DD)
- **Display**: DD-MM-YYYY

### Inverter Details
- ⚠️ **Status**: Needs migration
- **Issue**: Weather.date stored as String
- **Action**: Change to native Date type

### SolarPowerMeter
- ✅ **Status**: Partially standardized
- **Good**: DailyGeneration uses UTC normalization
- **Issue**: MonthlyGeneration uses separate year/month fields

### WeatherMeterManagement
- ⚠️ **Status**: Needs migration
- **Issue**: Stores dates as strings (DD-MMM-YY)
- **Action**: Change Weather.date and Meter.date to Date type

---

## 🐛 Common Pitfalls to Avoid

### ❌ Don't Do This

```javascript
// Storing dates as strings
date: { type: String }  // BAD

// Formatting with local timezone
new Date().toLocaleDateString()  // BAD - timezone dependent

// Using getDate/getMonth on non-UTC dates
date.getDate()  // BAD - use getUTCDate()

// Mutating shared date objects
function processDate(date) {
    date.setHours(0, 0, 0, 0);  // BAD - mutates original
}
```

### ✅ Do This Instead

```javascript
// Storing dates as native Date objects
date: {
    type: Date,
    set: (d) => normalizeToUTCMidnight(new Date(d))
}

// Using shared formatters
formatDDMMYYYY(date)  // GOOD

// Using UTC methods
date.getUTCDate()  // GOOD

// Cloning before mutation
function processDate(date) {
    const cloned = cloneDate(date);
    cloned.setHours(0, 0, 0, 0);
    return cloned;
}
```

---

## 🧪 Testing

### Test Cases to Verify

1. **Excel Import**: Excel serial number (45868) → Correct date
2. **API Input**: DD-MM-YYYY format → Stored correctly
3. **API Output**: Returns YYYY-MM-DD format
4. **Frontend Display**: Shows DD-MM-YYYY format
5. **Cross-App**: Date from App A matches in App B
6. **Timezone**: UTC midnight regardless of server timezone
7. **Leap Years**: Feb 29, 2024 → Validates correctly
8. **Edge Cases**: Invalid dates return null/error

### Example Tests

```javascript
const { parseDate, formatISO, formatDDMMYYYY } = require('./utils/dateUtils');

// Test Excel serial number
const excelDate = parseDate(45868);
console.assert(formatISO(excelDate) === '2025-07-15');

// Test DD-MM-YYYY input
const userDate = parseDate('15-07-2025');
console.assert(formatISO(userDate) === '2025-07-15');

// Test display format
console.assert(formatDDMMYYYY(userDate) === '15-07-2025');

// Test UTC midnight
console.assert(excelDate.getUTCHours() === 0);
console.assert(excelDate.getUTCMinutes() === 0);
```

---

## 📞 Support

For questions about date standardization:
1. Review this document
2. Check `shared/dateUtils.js` implementation
3. Refer to application-specific examples above

---

## 📝 Summary

**Remember the golden rule**:
- 📥 **Accept**: Multiple formats (YYYY-MM-DD, DD-MM-YYYY, Excel serial)
- 💾 **Store**: Native Date at UTC midnight
- 📤 **Return**: ISO format (YYYY-MM-DD) from APIs
- 👁️ **Display**: DD-MM-YYYY to users

By following this standard, all applications will seamlessly share date data without format conflicts or timezone issues.
