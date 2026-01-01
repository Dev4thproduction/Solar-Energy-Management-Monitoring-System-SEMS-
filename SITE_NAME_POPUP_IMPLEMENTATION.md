# Site Name Popup Implementation

## ✅ What's Been Implemented

### 1. **Site Name Modal Component**
Created: [SiteNameModal.tsx](WeatherMeterManagement/frontend/src/components/modals/SiteNameModal.tsx)

**Features:**
- Beautiful popup modal that appears when you select a file
- **Required field** - Won't let you proceed without entering a site name
- Minimum 2 characters validation
- Quick-select examples (Site-A, Site-B, Solar Plant 1, Plant-North)
- Keyboard shortcuts (Enter to confirm, Escape to cancel)
- Dark mode support

---

### 2. **Updated Weather Upload Page**
Modified: [WeatherUploadPage.tsx](WeatherMeterManagement/frontend/src/pages/Weather/WeatherUploadPage.tsx)

**New Workflow:**
1. User selects/drops an Excel file
2. **Popup appears immediately** asking for Site Name
3. User enters site name (required, min 2 characters)
4. User clicks "Continue"
5. File is accepted and ready for upload
6. Site name is displayed prominently in a blue badge
7. User can click "Change" to update site name anytime

**Key Changes:**
- `handleFileChange()` - Intercepts file selection to show modal
- `handleSiteNameConfirm()` - Saves site name and accepts file
- Site name is now **required** before upload (validation added)
- Blue badge shows current site name with "Change" button
- All uploaded data automatically gets the site name applied

---

## 🎯 How It Works

### User Experience Flow

```
1. User clicks or drags Excel file
   ↓
2. 🚨 POPUP APPEARS (mandatory)
   ┌──────────────────────────────────────┐
   │   Enter Site Name                    │
   │                                      │
   │   Site Name *                        │
   │   ┌────────────────────────────────┐ │
   │   │ e.g., Site-A, Solar Plant 1   │ │
   │   └────────────────────────────────┘ │
   │                                      │
   │   Examples:                          │
   │   [Site-A] [Site-B] [Solar Plant 1] │
   │                                      │
   │   [Cancel]        [Continue]         │
   └──────────────────────────────────────┘
   ↓
3. User enters "Site-A" and clicks Continue
   ↓
4. File accepted, blue badge appears:
   ┌────────────────────────────────────┐
   │ 🏢 Site Name: Site-A   [Change]   │
   └────────────────────────────────────┘
   ↓
5. User clicks "Upload & Validate"
   ↓
6. All records get "Site-A" in the Site Name column
   ↓
7. User submits to database
   ↓
8. ✅ Site Name appears in Weather Data table!
```

---

## 📱 Visual Design

### Popup Modal Features:
- **Icon**: Building/site icon in blue circle
- **Title**: "Enter Site Name"
- **Subtitle**: "Required for tracking and filtering"
- **Input field**:
  - Placeholder: "e.g., Site-A, Solar Plant 1, etc."
  - Auto-focus (cursor ready to type)
  - Error messages if validation fails
- **Quick Examples**: Click-to-fill buttons for common names
- **Buttons**:
  - Cancel (closes modal, clears file selection)
  - Continue (blue, primary action)

### Site Name Badge:
```
┌─────────────────────────────────────────┐
│ 🏢 Site Name: Site-A      [Change]     │
└─────────────────────────────────────────┘
```
- Blue background
- Building icon
- Bold site name
- "Change" link to update anytime

---

## 🔧 Technical Implementation

### Key Code Additions:

#### 1. Modal State Management
```typescript
const [showSiteNameModal, setShowSiteNameModal] = useState(false);
const [pendingFile, setPendingFile] = useState<File | null>(null);
```

#### 2. File Selection Handler
```typescript
const handleFileChange = (selectedFile: File | null) => {
  if (!selectedFile) return;

  // If site name already set, accept file directly
  if (siteName && siteName.trim()) {
    setFile(selectedFile);
    return;
  }

  // Otherwise, show modal first
  setPendingFile(selectedFile);
  setShowSiteNameModal(true);
};
```

#### 3. Site Name Confirmation
```typescript
const handleSiteNameConfirm = (name: string) => {
  setSiteName(name);
  if (pendingFile) {
    setFile(pendingFile);
    setPendingFile(null);
  }
};
```

#### 4. Upload Validation
```typescript
if (!siteName || !siteName.trim()) {
  pushToast({
    type: 'error',
    title: 'Site name required',
    message: 'Please enter a site name before uploading.',
  });
  return;
}
```

---

## ✅ What's Fixed

### Before:
- ❌ Site name field was optional and easy to miss
- ❌ Users uploaded without site name
- ❌ Weather Data table showed "-" for Site Name
- ❌ No way to filter or identify data source

### After:
- ✅ Site name popup appears **immediately** on file selection
- ✅ **Required field** - can't proceed without it
- ✅ Site name displayed prominently in blue badge
- ✅ All records automatically get site name
- ✅ Weather Data table shows actual site name
- ✅ Can change site name anytime before upload

---

## 🚀 Next Steps

### For Meter Upload Page:
The same implementation should be added to MeterUploadPage.tsx. Would you like me to add it?

### For Existing Data:
Use the admin API endpoint to update existing records:
```bash
curl -X POST http://localhost:3000/weather/admin/update-site-name \
  -H "Content-Type: application/json" \
  -d '{"siteName": "Site-A"}'
```

---

## 📝 User Instructions

### How to Upload Weather Data (New Flow):

1. Go to Weather Upload page
2. Click "Drop your Weather Excel file here" OR drag/drop file
3. **🚨 Popup appears** - Enter your site name (e.g., "Site-A")
4. Click "Continue"
5. Blue badge appears showing "Site Name: Site-A"
6. Click "Upload & Validate"
7. Review preview data (Site Name column will show "Site-A")
8. Click "Submit to Database"
9. ✅ Done! Site name is saved

### To Change Site Name:
- Before upload: Click "Change" in the blue badge
- After upload, before submit: Enter new site name in modal
- After submit: Use admin API endpoint to bulk update

---

## 🎨 Styling

The modal uses:
- Tailwind CSS for responsive design
- Dark mode support (auto-switches with system)
- Smooth animations (fadeIn backdrop, slideUp modal)
- Accessible design (keyboard navigation, focus management)
- Primary brand color for buttons

---

## 🔒 Validation Rules

- **Minimum length**: 2 characters
- **Required**: Cannot be empty or whitespace only
- **Trimmed**: Leading/trailing spaces removed automatically
- **No special validation**: Allows letters, numbers, hyphens, spaces, etc.

---

**Status**: ✅ Implemented and Ready to Test

**Files Modified**:
- Created: `SiteNameModal.tsx`
- Modified: `WeatherUploadPage.tsx`

**Testing**:
1. Restart your frontend development server
2. Go to Weather Upload page
3. Try to select a file - popup should appear
4. Test validation (empty, 1 character, valid name)
5. Verify site name appears in preview table
6. Submit and check Weather Data page

---

**Note**: Remember, you're using one MongoDB for inverter details across all projects. The site name helps distinguish which project/plant the data belongs to!
