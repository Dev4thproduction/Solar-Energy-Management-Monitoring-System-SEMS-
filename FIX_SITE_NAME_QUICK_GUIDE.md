# Quick Fix: Add Site Name to Weather Records

## Problem
Your weather records show "-" in the Site Name column because site name wasn't entered during upload.

---

## ✅ **EASIEST SOLUTION: Use the Admin API**

I've created a special admin endpoint to bulk update site names. Here's how to use it:

### Step 1: Make sure your backend is running
```bash
cd WeatherMeterManagement/backend
npm run start:dev
```

### Step 2: Update ALL weather records to "Site-A"

Open a new terminal or use a tool like Postman/Thunder Client and run:

```bash
curl -X POST http://localhost:3000/weather/admin/update-site-name \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Site-A"
  }'
```

**This will:**
- Update all weather records with empty/null site names
- Set them to "Site-A"
- Show you how many records were updated

**Expected Response:**
```json
{
  "success": true,
  "matched": 2242,
  "modified": 2242,
  "message": "Updated 2242 record(s) to site name \"Site-A\"",
  "siteName": "Site-A"
}
```

---

### Step 3: Refresh your browser

Go back to the Weather Data page and refresh. You should now see "Site-A" in the Site Name column instead of "-".

---

## 📊 **Check Current Site Name Distribution**

To see how many records have each site name:

```bash
curl -X POST http://localhost:3000/weather/admin/count-by-site \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "total": 2242,
  "bySite": [
    { "siteName": "No Site Name", "count": 2242 }
  ]
}
```

After updating, this will show:
```json
{
  "success": true,
  "total": 2242,
  "bySite": [
    { "siteName": "Site-A", "count": 2242 }
  ]
}
```

---

## 🎯 **Advanced: Update Specific Date Ranges**

### Update only June 22-25 records to "Site-A"
```bash
curl -X POST http://localhost:3000/weather/admin/update-site-name \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Site-A",
    "filter": {
      "startDate": "22-Jun-25",
      "endDate": "25-Jun-25",
      "onlyEmpty": true
    }
  }'
```

### Update all records (even those with existing site names)
```bash
curl -X POST http://localhost:3000/weather/admin/update-site-name \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Site-B",
    "filter": {
      "onlyEmpty": false
    }
  }'
```

---

## 🔧 **Using Postman / Thunder Client (GUI)**

If you prefer a GUI tool:

1. **Install Thunder Client** (VS Code extension) or use Postman
2. Create a new POST request
3. URL: `http://localhost:3000/weather/admin/update-site-name`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "siteName": "Site-A"
}
```
6. Click Send

---

## 🚀 **Prevent This in Future**

**Always enter the Site Name before uploading:**
1. Go to Weather Upload page
2. **Fill in "Site Name" field** (e.g., "Site-A", "Site-B", etc.)
3. Upload Excel file
4. Submit

The field says "(optional)" but it's actually important for tracking and filtering!

---

## ✅ **Verify It Worked**

1. Refresh your Weather Data page in the browser
2. Site Name column should now show "Site-A" instead of "-"
3. You can filter by site name in the dropdown

Done! 🎉
