# Troubleshooting Guide

## Issue: invGen and abtExport showing 0

### Root Causes

The calculation functions will return 0 if:

1. **No matching data exists in source systems**
2. **Site name doesn't match exactly**
3. **Date doesn't match exactly**
4. **Source APIs are not running**

### Detailed Investigation

#### Step 1: Check if Inverter Details has data

The imported CSV has these sites and dates:
- **Sites**: Alpha Solar Farm, Beta Industrial Park, Gamma Rooftop Array, Delta Power Station, Epsilon Commercial Center
- **Dates**: 2025-12-26, 2025-12-27, 2025-12-28, 2025-12-29, 2025-12-30

Check if Inverter Details API has data for these exact combinations:

```bash
# Check all inverter records
curl http://localhost:5002/api/records | jq '.records[] | {siteName, date}' | head -20
```

**Look for**:
- Does the `siteName` EXACTLY match? (case-sensitive)
- Does the `date` match? (Note: Inverter API stores dates with time component)

#### Step 2: Check the server logs

When you import or click "Recalculate", check the Final Submission server console. You should see:

```
Calculated invGen for Gamma Rooftop Array on 2025-12-30: 0.241 kWh (total: 241, records: 1)
Fetching meter data for date: 30-12-2025
Found 0 meter records for 30-12-2025
Calculated abtExport for 30-12-2025: 0 kWh (from 0 records)
```

This tells you:
- ✅ **invGen calculated successfully** (0.241 kWh from 241 total)
- ❌ **abtExport is 0** because no meter records exist for that date

#### Step 3: Verify date matching

The Inverter Details API uses **ISO dates with timestamps**:
```json
{
  "date": "2025-12-29T00:00:00.000Z"  // Matches 2025-12-29
}
```

Our code normalizes both dates to midnight before comparing, so this should work.

#### Step 4: Check meter data exists

WeatherMeter uses **DD-MM-YYYY format**:
```json
{
  "date": "30-12-2025",
  "activeEnergyExport": 150
}
```

Check if meter data exists:

```bash
curl "http://localhost:3000/meter?date=30-12-2025"
```

If this returns no data, then abtExport will be 0.

### Solutions

#### Solution 1: Ensure source data exists

Make sure both APIs have data for the dates in your CSV:

**For Inverter Details:**
- Upload inverter data for dates 2025-12-26 through 2025-12-30
- Site names must EXACTLY match the CSV (case-sensitive)

**For WeatherMeter:**
- Upload meter data with `activeEnergyExport` values
- Dates must be in DD-MM-YYYY format
- Must match the dates in the CSV

#### Solution 2: Use test data that matches existing records

Instead of using dates that don't have source data, check what dates ACTUALLY have data:

```bash
# Get available dates from Inverter Details
curl http://localhost:5002/api/records | jq '.records[].date' | sort -u

# Get available dates from WeatherMeter
curl http://localhost:3000/meter | jq '.data[].date' | sort -u
```

Then create a CSV with dates that have data in BOTH systems.

#### Solution 3: Seed the databases with matching data

Add data to both systems for the same sites and dates:

**Example for Dec 30, 2025:**

1. **Add to Inverter Details:**
   - Site: "Gamma Rooftop Array"
   - Date: 2025-12-30
   - Inverter 1: 83, Inverter 2: 69, Inverter 3: 89
   - Expected invGen: (83+69+89)/1000 = 0.241 kWh

2. **Add to WeatherMeter:**
   - Date: "30-12-2025"
   - activeEnergyExport: 650
   - Expected abtExport: 650 kWh

### Common Mistakes

❌ **Mistake 1**: Site name mismatch
```csv
Date,Site,POA
2025-12-30,gamma rooftop array,5.73  ← WRONG (lowercase)
```

✅ **Correct:**
```csv
Date,Site,POA
2025-12-30,Gamma Rooftop Array,5.73  ← Correct (exact match)
```

❌ **Mistake 2**: Wrong date format in source data
```json
// Meter data with wrong format
{
  "date": "2025-12-30"  ← WRONG (should be DD-MM-YYYY)
}
```

✅ **Correct:**
```json
{
  "date": "30-12-2025"  ← Correct
}
```

### Quick Test

Try calculating for a single record manually:

```bash
# Test calculation endpoint
curl "http://localhost:5003/api/calculate?site=Gamma%20Rooftop%20Array&date=2025-12-30"
```

Expected response:
```json
{
  "site": "Gamma Rooftop Array",
  "date": "2025-12-30",
  "invGen": 0.241,
  "abtExport": 650
}
```

If you get 0s, check the server logs to see which step is failing.

### Server Log Examples

**Successful calculation:**
```
Calculated invGen for Gamma Rooftop Array on 2025-12-30: 0.241 kWh (total: 241, records: 1)
Fetching meter data for date: 30-12-2025
Found 5 meter records for 30-12-2025
Calculated abtExport for 30-12-2025: 650 kWh (from 5 records)
```

**No inverter data:**
```
No matching inverter records for site: Gamma Rooftop Array, date: 2025-12-30
Calculated invGen for Gamma Rooftop Array on 2025-12-30: 0 kWh (total: 0, records: 0)
```

**No meter data:**
```
Fetching meter data for date: 30-12-2025
No meter data found for date: 30-12-2025
Calculated abtExport for 30-12-2025: 0 kWh (from 0 records)
```

### What Fixed in Latest Update

✅ **Fixed:**
- Removed `search` parameter that was causing 500 errors
- Now fetches all records and filters client-side
- Added comprehensive logging to see what's happening
- Added timeout handling

✅ **Now you'll see:**
- Exact values being calculated
- Number of records found
- Which step is failing (if any)

### Next Steps

1. Run the upload again with the fixed code
2. Watch the server console for detailed logs
3. If values are still 0, check the logs to see which data is missing
4. Add the missing data to the source systems OR use dates that already have data

## Still having issues?

Check:
1. ✅ All 3 services running (ports 5002, 3000, 5003)
2. ✅ MongoDB is running
3. ✅ Restart the Final Submission server to apply the fixes
4. ✅ Check server console logs during import
