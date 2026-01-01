# How to Add Site Name to Existing Weather Records

## Problem
Your weather data shows "-" in the Site Name column because the site name wasn't specified during upload.

## Quick Fix

### Option 1: Re-Upload with Site Name ✅ EASIEST
1. Go to Weather Upload page
2. **Enter Site Name** in the input field (e.g., "Site-A", "Site-B", etc.)
3. Upload your Excel file
4. Validate and Submit

The duplicate detection will update existing records with the site name.

---

### Option 2: Update Existing Records via MongoDB

If you have many records already uploaded, update them directly in MongoDB:

#### Update All Records to Single Site Name
```bash
# Connect to MongoDB
mongosh

# Use the database
use weather-meter-db

# Update all weather records to "Site-A"
db.weathers.updateMany(
  { siteName: { $exists: false } },
  { $set: { siteName: "Site-A" } }
)

# OR update records with empty/null siteName
db.weathers.updateMany(
  { $or: [{ siteName: null }, { siteName: "" }] },
  { $set: { siteName: "Site-A" } }
)
```

#### Update by Date Range
```bash
# Update records from June 22-25, 2025 to "Site-A"
db.weathers.updateMany(
  {
    date: { $regex: "^22-Jun-25|^23-Jun-25|^24-Jun-25|^25-Jun-25" },
    $or: [{ siteName: null }, { siteName: "" }]
  },
  { $set: { siteName: "Site-A" } }
)
```

---

### Option 3: Create API Endpoint to Update Site Names

I can create an admin endpoint to bulk update site names if you need it.

---

## Verify Update

After updating, refresh the Weather Data page in your browser. The Site Name column should now show "Site-A" (or whatever name you set) instead of "-".

---

## Prevent Future Issues

**Always enter the Site Name** in the upload form before uploading weather data:
- The field is labeled "Site Name (optional)" but it's actually important for tracking!
- Enter site name like: "Site-A", "Site-B", "Solar Plant 1", etc.

---

## Why This Matters

The site name is used for:
1. Filtering and searching weather data
2. Correlating weather with meter data
3. Syncing to SolarPowerMeter DailyGeneration
4. Identifying which plant the data belongs to
