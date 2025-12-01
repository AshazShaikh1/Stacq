# Stack Chrome Extension

A browser extension for quickly saving links to your Stack collections.

## ✨ Features

- **One-click save**: Save any webpage to your Stack with a single click
- **Smart preview**: See page title, description, and image before saving
- **Instant favicon**: Visual preview of the site you're saving
- **Deep linking**: Automatically opens your dashboard with the link ready to add
- **Dark theme**: Matches the Stack web app's beautiful dark UI

## 🚀 Installation

### Prerequisites

1. **Generate Icons** (one-time setup):
   - Open `generate-icons.html` in your browser
   - Click each "Download" button
   - Save files to `icons/` folder as:
     - `icon-16.png`
     - `icon-48.png`
     - `icon-128.png`
   - See `ICON_INSTRUCTIONS.md` for alternatives

2. **Configure API URL**:
   - Edit `popup.js` line 3:
     ```javascript
     const API_BASE = "https://your-production-url.com";
     ```
   - Edit `manifest.json` lines 13-15:
     ```json
     "host_permissions": [
       "https://your-production-url.com/*"
     ]
     ```

### Install in Chrome/Edge

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder
5. Done! 🎉

## 📖 Usage

1. Navigate to any website you want to save
2. Click the **Stack icon** in your browser toolbar
3. Review the preview (title, description, image)
4. Click **"Save to Stack"** button
5. Your dashboard opens with the Quick Add modal
6. Select a stack and save!

## 🎨 Customization

### Change API URL

For development:
```javascript
const API_BASE = "http://localhost:3000";
```

For production:
```javascript
const API_BASE = "https://stack.com";
```

### Styling

Edit `styles.css` to customize colors, fonts, or layout. The extension uses CSS variables that match the web app theme.

## 🐛 Troubleshooting

**Extension icon not showing?**
- Make sure PNG icon files exist in `icons/` folder
- Check file names: `icon-16.png`, `icon-48.png`, `icon-128.png`
- Reload the extension in `chrome://extensions`

**"Cannot access current tab URL"?**
- You're on a protected page (chrome://, edge://, etc.)
- Navigate to a regular website first

**Save button doesn't work?**
- Make sure you're logged into Stack
- Check `API_BASE` in `popup.js` is correct
- Verify your web app is running and accessible
- Check browser console for errors (right-click extension icon → Inspect popup)

**Metadata not loading?**
- Check that your web app's `/api/metadata` endpoint is working
- Verify CORS is enabled for extension requests
- The extension will still work with just tab title/URL as fallback

## 🔧 Development

### File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI structure
├── popup.js              # Main extension logic
├── styles.css            # Styling (dark theme)
├── icons/                # Icon files (PNG)
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── icon.svg          # Source SVG
├── generate-icons.html   # Icon generator tool
├── README.md             # This file
├── QUICK_START.md        # Quick setup guide
└── ICON_INSTRUCTIONS.md  # Icon generation help
```

### Testing

1. Make changes to `popup.js`, `popup.html`, or `styles.css`
2. Go to `chrome://extensions`
3. Click the refresh icon on the Stack extension card
4. Test the changes

### Debugging

1. Right-click the extension icon
2. Select "Inspect popup"
3. Use Chrome DevTools to debug

## 📝 API Requirements

The extension requires these endpoints on your web app:

### 1. Metadata Cache Check
```
GET /api/metadata?url={encoded_url}
Response: { ok: true, found: true, meta: {...} }
```

### 2. Metadata Queue (Optional)
```
POST /api/metadata/queue
Body: { url: "..." }
Response: { ok: true, meta: {...} }
```

### 3. Dashboard with Deep Link
```
GET /dashboard?add_link={encoded_url}
Opens dashboard with QuickAddModal pre-filled
```

See `app/api/metadata/route.ts` for implementation details.

## 🔒 Permissions

- `activeTab`: Access current tab URL and title
- `scripting`: (Not used, but may be needed for future features)
- `storage`: (Not used, but reserved for future settings)
- `host_permissions`: Access your Stack web app API

## 📄 License

Same as main Stack project.

## 🤝 Contributing

1. Make changes to extension files
2. Test thoroughly
3. Update documentation if needed
4. Submit PR

## 💡 Future Enhancements

- [ ] Save directly to a specific stack (if user has only one)
- [ ] Add note field in popup
- [ ] Keyboard shortcuts (e.g., Ctrl+Shift+S)
- [ ] Context menu integration
- [ ] Offline support
- [ ] Sync settings across devices
