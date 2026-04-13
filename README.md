# AI Chat Pro Client

A fast, privacy-focused chat client for multiple AI providers. Works as a **Progressive Web App (PWA)** on desktop and mobile, or as a **Chrome Extension**.

## Features

- **Multi-Provider Support** — Perplexity, OpenAI, Anthropic (Claude), LM Studio, or any OpenAI-compatible API
- **Installable PWA** — Add to home screen on mobile or install on desktop for a native app experience
- **Offline-Ready** — Works offline with local AI via LM Studio
- **Dark & Light Themes** — Automatic or manual theme switching
- **Chat Management** — Search, rename, delete, and export conversations (Markdown / JSON)
- **Mobile-Optimized** — Finger-friendly touch targets, responsive sidebar, safe area support for notched devices
- **Multilingual** — German and English (i18n)
- **No Backend Required** — Runs entirely in the browser; API keys stay on your device
- **Remote Announcements** — Optional server-pushed notifications for updates

## Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/dan17612/AI-Chat-Web-App.git
   cd AI-Chat-Web-App
   ```

2. **Serve locally** — Use any static file server:
   ```bash
   # Python
   python -m http.server 8080

   # Node.js (npx)
   npx serve .
   ```

3. **Open** `http://localhost:8080` in your browser.

4. **Add your API key** in Settings and start chatting.

### Install as PWA

- **Desktop (Chrome/Edge):** Click the install icon in the address bar.
- **Mobile (iOS Safari):** Tap Share > Add to Home Screen.
- **Mobile (Android Chrome):** Tap the install banner or Menu > Install App.

## Project Structure

```
├── index.html          Main chat interface
├── settings.html       Settings page (API keys, model, language)
├── style.css           Full responsive stylesheet
├── settings.css        Settings page styles
├── app.js              Core chat logic & UI
├── api.js              Provider API abstraction layer
├── storage.js          Storage abstraction (localStorage / chrome.storage)
├── i18n.js             Internationalization (DE/EN)
├── announcement.js     Remote announcement system
├── sw.js               Service worker for offline/caching
├── manifest.webmanifest PWA manifest
└── icons/              App icons (16–512px)
```

## Supported Providers

| Provider | API Key Required | Notes |
|----------|:---:|-------|
| Perplexity | Yes | Default provider, includes web sources |
| OpenAI | Yes | GPT models |
| Anthropic | Yes | Claude models |
| LM Studio | No/Yes | Local AI, works offline |
| Custom | Yes | Any OpenAI-compatible endpoint |

## Configuration

All settings are stored locally in the browser:

- **API Key** — Stored in `localStorage` (web) or `chrome.storage.local` (extension)
- **Model** — Select from provider-specific models
- **System Prompt** — Custom system instructions
- **Theme** — Dark / Light
- **Language** — German / English
- **Send Shortcut** — Enter or Ctrl+Enter

## Tech Stack

- **Vanilla JavaScript** — No frameworks, no build step
- **CSS Custom Properties** — Design token system with dark/light themes
- **Service Worker** — Offline caching strategy
- **Web Manifest** — Full PWA support with standalone display

## License

MIT
