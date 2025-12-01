# Installation Guide

## Quick Install (3 Steps)

### Step 1: Generate Icons ⚠️ Required

**Easiest Method:**
1. Open `generate-icons.html` in your browser
2. Click each "Download" button (16×16, 48×48, 128×128)
3. Save files to `icons/` folder as:
   - `icon-16.png`
   - `icon-48.png`
   - `icon-128.png`

**Alternative:** See `ICON_INSTRUCTIONS.md` for other methods.

### Step 2: Configure API URL

**For Development:**
- Already set to `http://localhost:3000` ✅
- No changes needed if testing locally

**For Production:**
1. Edit `popup.js` line 3:
   ```javascript
   const API_BASE = "https://your-production-url.com";
   ```

2. Edit `manifest.json` lines 13-15:
   ```json
   "host_permissions": [
     "https://your-production-url.com/*"
   ]
   ```

### Step 3: Install Extension

1. Open Chrome/Edge
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `extension` folder
6. Done! 🎉

## Verify Installation

1. Look for the Stack icon in your browser toolbar
2. Navigate to any website (e.g., https://example.com)
3. Click the Stack icon
4. You should see a preview popup with "Save to Stack" button

## Troubleshooting

**No icon showing?**
- Check that PNG files exist in `icons/` folder
- Reload extension in `chrome://extensions`

**Extension not loading?**
- Make sure you selected the `extension` folder (not parent folder)
- Check browser console for errors

**Save button doesn't work?**
- Verify you're logged into Stack
- Check `API_BASE` URL is correct
- Make sure your web app is running

## Next Steps

- Read `README.md` for full documentation
- See `QUICK_START.md` for usage guide
- Check `ICON_INSTRUCTIONS.md` if you need icon help
