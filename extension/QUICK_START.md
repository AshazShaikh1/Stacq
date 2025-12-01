# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Generate Icons (One-time setup)

**Option A: Use Online Tool (Easiest)**
1. Go to https://convertio.co/svg-png/
2. Upload `icons/icon.svg`
3. Convert to PNG and download
4. Resize to 16x16, 48x48, 128x128
5. Save as `icon-16.png`, `icon-48.png`, `icon-128.png` in `icons/` folder

**Option B: Use HTML Generator**
1. Open `generate-icons.html` in your browser
2. Click each "Download" button
3. Save files to `icons/` folder

**Option C: Create Simple Placeholders**
- Create 3 colored squares (cyan background, white "S")
- Resize to 16x16, 48x48, 128x128
- Save as PNG files in `icons/` folder

### 2. Configure (For Production)

Edit `popup.js` line 3:
```javascript
const API_BASE = "https://your-production-url.com";
```

Edit `manifest.json` line 13-15:
```json
"host_permissions": [
  "https://your-production-url.com/*"
]
```

### 3. Install

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Done! 🎉

## ✅ Test It

1. Go to any website (e.g., https://example.com)
2. Click the Stack icon in your toolbar
3. You should see a preview with "Save to Stack" button
4. Click it → Opens dashboard with Quick Add modal
5. Select a stack and save!

## 🐛 Troubleshooting

**Icons not showing?**
- Make sure PNG files exist in `icons/` folder
- Check file names: `icon-16.png`, `icon-48.png`, `icon-128.png`

**"Cannot access current tab URL"?**
- You're on a protected page (chrome://, etc.)
- Navigate to a regular website first

**Save button doesn't work?**
- Make sure you're logged into Stack
- Check `API_BASE` in `popup.js` is correct
- Verify your web app is running

## 📚 More Info

- Full docs: `README.md`
- Icon help: `ICON_INSTRUCTIONS.md`
- Installation: `INSTALL.md`

