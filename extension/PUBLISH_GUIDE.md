# Publishing Stack Extension to Chrome Web Store

## Prerequisites

1. **Chrome Web Store Developer Account**
   - One-time fee: $5 USD (lifetime)
   - Go to: https://chrome.google.com/webstore/devconsole
   - Sign in with your Google account
   - Pay the registration fee

2. **Production API URL**
   - Your Stack web app must be deployed and accessible
   - Update `popup.js` with production URL
   - Update `manifest.json` host permissions

## Step 1: Prepare Extension for Production

### 1.1 Update API Configuration

Edit `popup.js`:
```javascript
const API_BASE = "https://your-production-domain.com";
```

### 1.2 Update Host Permissions

Edit `manifest.json`:
```json
"host_permissions": [
  "https://your-production-domain.com/*"
]
```

### 1.3 Generate Production Icons

Make sure you have:
- `icons/icon-16.png` (16×16 pixels)
- `icons/icon-48.png` (48×48 pixels)
- `icons/icon-128.png` (128×128 pixels)

Use `generate-icons.html` or follow `ICON_INSTRUCTIONS.md`

### 1.4 Remove Development Files

Before packaging, remove or exclude:
- `README.md` (optional - you can keep it)
- `QUICK_START.md` (optional)
- `INSTALL.md` (optional)
- `ICON_INSTRUCTIONS.md` (optional)
- `generate-icons.html` (optional)
- `create-icons.js` (optional)
- `.gitkeep` (if exists)

**Keep these files:**
- `manifest.json`
- `popup.html`
- `popup.js`
- `styles.css`
- `icons/` folder with PNG files

## Step 2: Package Extension

### Option A: Manual ZIP (Recommended)

1. Create a new folder (e.g., `stack-extension-v1.0.0`)
2. Copy these files/folders:
   ```
   stack-extension-v1.0.0/
   ├── manifest.json
   ├── popup.html
   ├── popup.js
   ├── styles.css
   └── icons/
       ├── icon-16.png
       ├── icon-48.png
       └── icon-128.png
   ```
3. Right-click the folder → "Compress" or "Send to → Compressed folder"
4. Name it: `stack-extension-v1.0.0.zip`

### Option B: Command Line

```bash
cd extension
# Remove unnecessary files first
zip -r ../stack-extension-v1.0.0.zip manifest.json popup.html popup.js styles.css icons/
```

## Step 3: Create Chrome Web Store Listing

### 3.1 Go to Developer Dashboard

1. Visit: https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload your ZIP file

### 3.2 Fill Store Listing

**Required Fields:**

1. **Name**: `Stack - Curate the Web`
2. **Summary** (132 chars max):
   ```
   Quickly save links to your Stack collections. The human search engine.
   ```
3. **Description** (up to 16,000 chars):
   ```
   Stack Extension - Save Any Webpage to Your Collections

   Features:
   • One-click save: Save any webpage to your Stack with a single click
   • Smart preview: See page title, description, and image before saving
   • Instant favicon: Visual preview of the site you're saving
   • Deep linking: Automatically opens your dashboard with the link ready to add
   • Beautiful dark theme: Matches the Stack web app's elegant UI

   How it works:
   1. Navigate to any website you want to save
   2. Click the Stack icon in your browser toolbar
   3. Review the preview (title, description, image)
   4. Click "Save to Stack" button
   5. Your dashboard opens with the Quick Add modal
   6. Select a stack and save!

   Perfect for:
   • Researchers collecting resources
   • Designers curating inspiration
   • Developers bookmarking tools
   • Anyone organizing the web

   Get started at: https://stack.com
   ```

4. **Category**: Choose "Productivity" or "Social & Communication"

5. **Language**: English (United States)

6. **Icon** (128×128 PNG): Upload `icons/icon-128.png`

7. **Screenshots** (1280×800 or 640×400):
   - Take screenshots of the extension popup
   - Show the preview card, save button, etc.
   - Minimum 1, maximum 5 screenshots

8. **Promotional Images** (optional but recommended):
   - Small promo tile: 440×280
   - Large promo tile: 920×680
   - Marquee promo tile: 1400×560

### 3.3 Privacy & Permissions

**Privacy Practices:**

Create a privacy policy page on your website (e.g., `https://stack.com/privacy`) that covers:

- What data is collected: URL of pages you save
- How data is used: Stored in your Stack account
- Data storage: Your Stack account
- Third-party services: None
- User control: Users can delete saved links anytime

**Permissions Explanation:**

- `activeTab`: To access the current tab's URL and title when you click the extension
- `host_permissions`: To communicate with your Stack web app API

### 3.4 Distribution

- **Visibility**: Choose "Public" (anyone can install) or "Unlisted" (only with link)
- **Regions**: Select countries or "All regions"

## Step 4: Submit for Review

1. Review all information
2. Click "Submit for Review"
3. Wait for review (usually 1-3 business days)
4. You'll receive email notifications about status

## Step 5: After Approval

1. **Extension URL**: Chrome will provide a public URL like:
   ```
   https://chrome.google.com/webstore/detail/stack-curate-the-web/[extension-id]
   ```

2. **Update Your Website**: Add a "Install Extension" button linking to the store

3. **Version Updates**: When you update:
   - Increment version in `manifest.json`
   - Create new ZIP
   - Upload to Developer Dashboard
   - Submit for review (updates are usually faster)

## Common Issues & Solutions

### Rejection Reasons

1. **Missing Privacy Policy**
   - Solution: Create a privacy policy page and link it

2. **Insufficient Description**
   - Solution: Add more details about features and usage

3. **Poor Screenshots**
   - Solution: Use high-quality screenshots showing the extension in action

4. **Misleading Functionality**
   - Solution: Ensure description accurately reflects what the extension does

### Version Updates

When updating:
1. Change version in `manifest.json`:
   ```json
   "version": "1.0.1"
   ```
2. Package new ZIP
3. Upload to Developer Dashboard
4. Submit for review

## Checklist Before Publishing

- [ ] API URL updated to production
- [ ] Host permissions updated in manifest.json
- [ ] All icons generated (16, 48, 128 PNG)
- [ ] Version number set correctly
- [ ] Privacy policy page created
- [ ] Extension tested thoroughly
- [ ] ZIP file created and tested locally
- [ ] Store listing information prepared
- [ ] Screenshots taken
- [ ] Developer account created and paid

## Resources

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Publishing Guide: https://developer.chrome.com/docs/webstore/publish
- Manifest V3 Docs: https://developer.chrome.com/docs/extensions/mv3/
- Privacy Policy Template: https://www.privacypolicygenerator.info/

## Support

If you encounter issues:
- Check Chrome Web Store Developer Support
- Review rejection reasons carefully
- Ensure all requirements are met
- Test extension thoroughly before submitting

