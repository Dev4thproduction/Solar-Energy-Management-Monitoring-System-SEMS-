# Quick Start - Excel Import with Auto-Calculation

## 🎯 What You Get

Upload a simple CSV file with just **Date, Site, POA, Status**, and the system will:
- ✅ **Auto-calculate Inv Gen** from Inverter Details (sum of all inverters / 1000)
- ✅ **Auto-calculate ABT Export** from WeatherMeter (sum of activeEnergyExport)
- ✅ Import all records in bulk
- ✅ Display calculated values in the Final Submission UI

## 📋 Prerequisites

Make sure all 3 services are running:

```bash
# Terminal 1 - Inverter Details (Port 5002)
cd Inverter_Details/server
npm start

# Terminal 2 - WeatherMeter (Port 3000)
cd WeatherMeterManagement/backend
npm run start:dev

# Terminal 3 - Final Submission (Port 5003)
cd Final_Submission/server
npm install  # First time only to install new dependencies
npm start
```

## 🚀 Quick Test (3 Steps)

### Step 1: Install Dependencies

```bash
cd Final_Submission/server
npm install
```

This installs: `axios`, `multer`, `xlsx`, `form-data`

### Step 2: Run the Test Script

```bash
# From Final_Submission/server directory
npm run test:upload
```

**OR** manually:

```bash
# From Final_Submission directory
node test_upload.js
```

### Step 3: View Results

Open your browser: **http://localhost:5176**

You should see 25 imported records with auto-calculated values!

## 📄 Sample CSV File

File: `sample_final_submission.csv`

```csv
Date,Site,POA (kWh/m²),Status
2025-12-30,Epsilon Commercial Center,5.24,Draft
2025-12-30,Delta Power Station,6.39,Draft
2025-12-30,Gamma Rooftop Array,5.73,Draft
...
```

**Note**: NO need for `Inv Gen` or `ABT Export` columns - they're calculated automatically! 🎉

## 🔧 Manual Upload (Using curl)

```bash
cd Final_Submission

curl -X POST http://localhost:5003/api/submissions/upload \
  -F "file=@sample_final_submission.csv" \
  -F "autoCalculate=true"
```

## 📊 Expected Output

```json
{
  "message": "Successfully uploaded 25 submissions",
  "count": 25,
  "autoCalculated": true
}
```

## 🎨 UI Features

After importing, you can:
- 🔄 Click **"Recalculate"** button on any row to refresh calculated values
- 📅 Filter by date range, month, year
- 🏢 Filter by site
- 📈 Change status (Draft → Submitted → Approved/Rejected)

## 🐛 Troubleshooting

### "No response from server"
**Fix**: Make sure Final Submission API is running on port 5003

### "invGen and abtExport are 0"
**Fix**:
1. Check Inverter Details API (port 5002) is running
2. Check WeatherMeter API (port 3000) is running
3. Verify source data exists for the same site and date

### "Error: ENOENT: no such file"
**Fix**: Run the command from the correct directory (Final_Submission)

## 📚 Full Documentation

- **Import Guide**: See `IMPORT_GUIDE.md`
- **Calculation Feature**: See `CALCULATION_FEATURE.md`

## 💡 Tips

1. **Site names must match exactly** (case-sensitive)
   - ✅ "Alpha Solar Farm"
   - ❌ "alpha solar farm"
   - ❌ "Alpha solar farm"

2. **Date format**: Use `YYYY-MM-DD` (e.g., 2025-12-30)

3. **Valid site names**:
   - Alpha Solar Farm
   - Beta Industrial Park
   - Gamma Rooftop Array
   - Delta Power Station
   - Epsilon Commercial Center

## ⚡ Performance

- **25 records**: ~3-5 seconds
- **100 records**: ~10-15 seconds

Each record makes 2 API calls (Inverter + Meter), processed in parallel.

## 🎉 Success!

That's it! You now have:
- ✅ Bulk Excel import
- ✅ Auto-calculated Inv Gen and ABT Export
- ✅ Real-time data from source systems
- ✅ Manual recalculation option

Enjoy! 🚀
