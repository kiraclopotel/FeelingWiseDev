# FeelingWise

**Content neutralization that removes emotional manipulation while preserving the message.**

FeelingWise is a privacy-first desktop application with browser extension that helps users identify and neutralize manipulative content in social media feeds. Unlike fact-checkers or censorship tools, FeelingWise preserves the author's viewpoint and message while removing emotional manipulation techniques.

## Philosophy

FeelingWise neutralizes **HOW** something is said, not **WHAT** is being said.

**Example:**
- **Original**: `"WAKE UP AMERICA!!! The RADICAL LEFT wants to DESTROY everything you hold dear!!!"`
- **Neutralized**: `"I would argue that progressive policies pose significant risks to values you hold dear."`

The viewpoint survives. The manipulation is removed. The voice is preserved.

### What FeelingWise is NOT
- Not a fact-checker (we don't decide what's true)
- Not a censor (original is always accessible)
- Not political (same rules for left and right)
- Not a warning system (no scary labels)

## Features

- **Local AI Processing**: All analysis happens on your device using Ollama
- **Browser Extension**: Automatically neutralizes Twitter/X, Facebook, and YouTube
- **Three Protection Modes**: Child, Teen, and Adult with age-appropriate explanations
- **Show Original Toggle**: Always see the original when you want
- **SQLite Caching**: Instant results for repeated content
- **Hardware Detection**: Recommends optimal AI models for your system

## Installation

### Desktop App (Required)

**Prerequisites:**
- Node.js 18+
- Rust (for building from source)
- [Ollama](https://ollama.ai) installed

```bash
# Clone the repository
git clone https://github.com/kiraclopotel/FeelingWise.git
cd FeelingWise

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Browser Extension

1. Ensure the desktop app is running with Ollama active
2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Enable "Developer mode"
4. Click "Load unpacked" (or "Load Temporary Add-on" for Firefox)
5. Select the `browser-extension` folder

## Usage

### Desktop App
1. Launch FeelingWise
2. Complete the first-run setup wizard (installs Ollama model)
3. Paste any suspicious text into the Analyze tab
4. Review the neutralized version and detected techniques

### Browser Extension
1. With the desktop app running, browse social media normally
2. Manipulative content is automatically neutralized
3. Click the FeelingWise icon to toggle settings or view status
4. Click "Show Original" on any post to see the original

## Supported Platforms

### Social Media (Browser Extension)
- Twitter/X
- Facebook
- YouTube (titles, descriptions, comments)

### Desktop
- Windows (MSI/NSIS installers)
- macOS (DMG)
- Linux (AppImage, Deb)

## AI Models

FeelingWise recommends models based on your system:

| RAM | Recommended Model | Size |
|-----|------------------|------|
| 4-8GB | phi3:mini | 2.4GB |
| 8-16GB | llama3.2:3b | 2.0GB |
| 16GB+ | neural-chat | 4.7GB |

## Privacy

- All AI processing happens **locally** on your device
- No data leaves your computer
- No accounts, no tracking, no cloud services
- The browser extension only communicates with localhost

## Project Structure

```
FeelingWise/
├── App.tsx                 # Main React application
├── components/             # React components
│   ├── AnalyzeTab.tsx     # Content analysis interface
│   ├── SetupWizard.tsx    # First-run configuration
│   └── StatsTab.tsx       # Cache statistics
├── services/              # Frontend services
│   └── localAIService.ts  # Ollama/Tauri integration
├── src-tauri/             # Rust backend
│   └── src/
│       ├── lib.rs         # Tauri commands
│       ├── ollama.rs      # Ollama management
│       ├── hardware.rs    # System detection
│       └── cache.rs       # SQLite caching
└── browser-extension/     # Browser extension
    ├── manifest.json
    ├── background.js
    ├── content-scripts/   # Platform-specific scripts
    └── popup/             # Extension popup UI
```

## Detection Criteria

Content is flagged for potential manipulation if it contains:
- **ALL CAPS** formatting (4+ consecutive capitals)
- **Excessive punctuation** (!!! or ???)
- **Alarm emojis** (warning signs, fire, sirens)
- **Urgency language** (urgent, now, immediately, breaking)
- **Fear appeals** (destroy, disaster, catastrophe, crisis)
- **Ad hominem attacks** (insults directed at people rather than arguments)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License

---

**FeelingWise: Protection without control. Clarity without censorship.**
