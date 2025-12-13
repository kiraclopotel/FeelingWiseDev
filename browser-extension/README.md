# FeelingWise Browser Extension

Browser extension that neutralizes emotional manipulation in social media feeds by communicating with your local FeelingWise desktop app.

## Features

- **Twitter/X Support**: Automatically processes tweets in your timeline
- **Facebook Support**: Neutralizes posts in your news feed
- **YouTube Support**: Processes video titles, descriptions, and comments
- **Privacy-First**: All AI processing happens locally on your device
- **Show Original Toggle**: Always see the original content when you want
- **Age-Based Modes**: Child, Teen, and Adult protection levels

## Installation

### Prerequisites

1. **FeelingWise Desktop App** must be installed and running
2. Ollama must be running with at least one model installed (phi3:mini recommended)

### Chrome / Edge / Brave

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `browser-extension` folder (e.g., `manifest.json`)

**Note:** Firefox requires some manifest changes for full compatibility. See [Firefox Compatibility](#firefox-compatibility) below.

## Usage

1. **Ensure the desktop app is running** with Ollama active
2. Browse Twitter, Facebook, or YouTube as normal
3. Manipulative content will be automatically neutralized
4. Click the FeelingWise icon in your toolbar to:
   - Check connection status
   - Toggle protection on/off
   - Change protection mode (Child/Teen/Adult)
   - Toggle indicators visibility

## How It Works

1. Content scripts monitor social media feeds for new posts
2. Text is analyzed for manipulation indicators (ALL CAPS, excessive punctuation, fear words, etc.)
3. Suspicious content is sent to your local Ollama instance via localhost:11434
4. The AI neutralizes the emotional manipulation while preserving the message
5. The neutralized version replaces the original (with option to toggle back)

## Detection Criteria

Content is flagged for neutralization if it contains:
- **ALL CAPS** text (4+ consecutive capital letters)
- **Excessive punctuation** (!!! or ???)
- **Alarm emojis** (warning signs, fire, sirens)
- **Urgency words** (urgent, now, immediately, breaking, exposed)
- **Fear words** (destroy, disaster, catastrophe, crisis, threat)

## Privacy

- All AI processing happens **locally** on your device
- No data is sent to external servers
- The extension only communicates with `localhost:11434` (Ollama)
- No tracking, no analytics, no cloud services

## Firefox Compatibility

For Firefox, modify `manifest.json`:

```json
{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"]
  },
  "browser_action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  }
}
```

## Troubleshooting

### "Offline" Status in Popup

1. Ensure FeelingWise desktop app is running
2. Check that Ollama is active (look for "Local AI" indicator in the app)
3. Verify Ollama is accessible at `http://localhost:11434`

### Content Not Being Neutralized

1. Check that protection is enabled in the popup
2. The content may not meet detection criteria
3. Try reloading the page

### Slow Processing

1. Processing depends on your hardware and model size
2. Consider using a smaller model (phi3:mini) for faster responses
3. Results are cached to speed up repeated content

## Development

```bash
# Clone the repo
git clone https://github.com/kiraclopotel/FeelingWise.git

# The extension is in the browser-extension folder
cd FeelingWise/browser-extension

# Load as unpacked extension in your browser
```

## License

MIT License - See main project for details.
