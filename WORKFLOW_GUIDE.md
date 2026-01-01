# Complete Workflow Guide - Inverter to Final Submission

## Overview

This guide explains the **end-to-end workflow** for submitting solar power generation data from Inverter Details to Final Submission with auto-calculation.

## 📋 Workflow Steps

### Step 1: Upload Inverter Data

**Go to**: Inverter Details (Port 5175)

1. Upload your inverter Excel/CSV file with columns:
   - Site Name
   - Date
   - Inverter 1, Inverter 2, Inverter 3, etc.

2. The data will be imported with status = "draft"

**Example CSV**:
```csv
Site Name,Date,Inverter 1,Inverter 2,Inverter 3
Gamma Rooftop Array,2025-12-29,83,69,89
Delta Power Station,2025-12-29,87,83,81
Alpha Solar Farm,2025-12-29,75,77,87
```

### Step 2: Submit Inverter Records

**In Inverter Details page**:

1. Review all records to ensure accuracy
2. Click the **"Submit All"** button at the top right
3. All draft records will change status from "Draft" (🟡 amber) to "Site Publish" (🟣 purple)
4. Once submitted, records are ready for Final Submission to use

**Important**:
- ✅ Only **site publish** records will be used for calculations
- ❌ Draft records will be ignored
- 💡 You can edit records before submitting
- 🔒 Once submitted to site publish, records cannot be edited or deleted

### Step 3: Auto-Calculate in Final Submission

**Go to**: Final Submission (Port 5176)

#### Option A: Manual Import with Auto-Calc

1. Upload a CSV with just:
   ```csv
   Date,Site,POA (kWh/m²),Status
   2025-12-29,Gamma Rooftop Array,5.73,Draft
   2025-12-29,Delta Power Station,6.78,Draft
   ```

2. Set `autoCalculate=true` when uploading

3. The system will:
   - Find the **site publish** inverter record for that site/date
   - Calculate `invGen = (Inverter 1 + Inverter 2 + Inverter 3 + ...) / 1000`
   - Calculate `abtExport` from meter data
   - Save the record with calculated values

#### Option B: Manual Recalculate

1. View existing records in Final Submission
2. Click **"🔄 Recalculate"** button on any row
3. System fetches latest site publish inverter data and recalculates

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. Upload Inverter Data                      │
│                    (Inverter Details - Port 5175)               │
│                                                                 │
│   Excel/CSV → Import → All Status: Draft (🟡)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. Submit All Records                        │
│                                                                 │
│   Click "Submit All (X)" Button → All Status: Site Publish (🟣)│
│   (Bulk submission of all draft records)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  3. Final Submission Calculation                │
│                  (Final Submission - Port 5176)                 │
│                                                                 │
│   Upload CSV → Auto-Calculate → Fetch ONLY Site Publish Records│
│                                                                 │
│   invGen = SUM(Inverter 1-N) / 1000 (from submitted records)  │
│   abtExport = SUM(activeEnergyExport) (from meter data)       │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Complete Example

### Example 1: Gamma Rooftop Array on Dec 29, 2025

**Step 1 - Inverter Details**:
```
Site Name: Gamma Rooftop Array
Date: 2025-12-29
Inverter 1: 83
Inverter 2: 69
Inverter 3: 89
Status: Draft
```

**Step 2 - Click "Submit All"**:
```
Status changes to: Site Publish ✅
```

**Step 3 - Final Submission**:
Upload CSV:
```csv
Date,Site,POA (kWh/m²),Status
2025-12-29,Gamma Rooftop Array,5.73,Draft
```

**Result**:
```
✅ invGen = (83 + 69 + 89) / 1000 = 0.241 kWh
✅ abtExport = (from meter data)
✅ POA = 5.73 kWh/m²
```

## 🚨 Troubleshooting

### Issue: invGen is 0 after calculation

**Possible Causes**:
1. ❌ Inverter record status is still "Draft" (not site publish)
2. ❌ Site name doesn't match exactly
3. ❌ Date doesn't match exactly
4. ❌ No inverter data exists for that site/date

**Solution**:
1. Go to Inverter Details
2. Find the record for the site/date
3. Click **"Submit All"** button
4. Return to Final Submission
5. Click **"🔄 Recalculate"**

### Issue: Can't find Submit All button

**Check**:
- Submit All button only appears when there are draft records
- Once submitted, the status badge turns purple showing "Site Publish"
- You can't submit the same records twice

### Issue: Wrong date in Inverter Details

**Fix**:
1. Edit the record (click edit icon)
2. Update the date
3. Save
4. Click "Submit All"

## 📊 Status Legend

| Status | Color | Meaning | Action Available |
|--------|-------|---------|-----------------|
| Draft | 🟡 Amber | Not submitted yet | Can Submit |
| Site Publish | 🟣 Purple | Ready for Final Submission | Used in calculations |
| Active | 🟢 Green | Active inverter | N/A |
| Inactive | 🔴 Red | Inactive inverter | N/A |
| Maintenance | 🔵 Blue | Under maintenance | N/A |

## 🔐 Best Practices

1. **Review before submitting**
   - Check all inverter values are correct
   - Verify site name matches exactly
   - Confirm date is accurate

2. **Submit daily**
   - Submit inverter records at end of each day
   - Don't wait for month-end

3. **Batch processing**
   - Upload all inverter data first
   - Review in bulk
   - Submit all at once

4. **Data consistency**
   - Use exact same site names across all systems
   - Use consistent date formats (YYYY-MM-DD)
   - Keep inverter naming consistent (Inverter 1, Inverter 2, etc.)

## 🎉 Benefits of This Workflow

✅ **Data Integrity**: Only reviewed and site published data is used
✅ **Audit Trail**: Clear status shows what's been finalized
✅ **Flexibility**: Can edit drafts before submitting
✅ **Auto-Calculation**: No manual entry of totals needed
✅ **Real-time**: Click recalculate anytime to get latest values

## 📝 Quick Commands

### Upload Inverter Data
```bash
# Upload to Inverter Details
curl -X POST http://localhost:5002/api/records/upload \
  -F "file=@inverter_data.csv"
```

### Submit a Record
```bash
# Change status from draft to site publish
curl -X PUT http://localhost:5002/api/records/{record_id} \
  -H "Content-Type: application/json" \
  -d '{"status": "site publish"}'
```

### Calculate Final Submission
```bash
# Get calculated values
curl "http://localhost:5003/api/calculate?site=Gamma%20Rooftop%20Array&date=2025-12-29"
```

### Upload to Final Submission with Auto-Calc
```bash
curl -X POST http://localhost:5003/api/submissions/upload \
  -F "file=@final_submission.csv" \
  -F "autoCalculate=true"
```

## 🌐 Access URLs

- **Inverter Details**: http://localhost:5175
- **Final Submission**: http://localhost:5176
- **WeatherMeter**: http://localhost:3001

---

**That's it!** You now have a complete workflow for managing solar power data from inverters to final submission with automatic calculations.
