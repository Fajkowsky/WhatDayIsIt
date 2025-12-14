# WhatDayIsIt

A Chrome extension that highlights dates on web pages and shows what day of the week they fall on.

![WhatDayIsIt Icon](icon128.png)

## Features

- **Automatic date detection** - Finds dates in any format on webpages
- **Day of week tooltip** - Hover over the 🗓 icon to see the day
- **Multiple formats supported** - ISO, US, EU, English text, Polish text
- **Customizable** - Toggle highlight, change icon position
- **Privacy-first** - Zero data collection, works entirely offline

## Supported Date Formats

| Format     | Examples                                |
| ---------- | --------------------------------------- |
| ISO        | `2024-12-25`, `2024-12-25T14:30:00Z`    |
| US Numeric | `12/25/2024`, `12-25-2024`              |
| EU Numeric | `25.12.2024`, `25/12/2024`              |
| English    | `December 25, 2024`, `Dec 25th`         |
| Polish     | `25 grudnia 2024`, `15 stycznia`        |
| Relative   | `today`, `tomorrow`, `dzisiaj`, `jutro` |

## Installation

### From Chrome Web Store

_(Coming soon)_

### Manual Installation (Developer Mode)

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select this directory

## Development

```bash
npm install        # Install dependencies
npm run build      # Bundle source files
npm run test       # Run tests
npm run lint       # Check code style
npm run check      # Run all checks
```

## Project Structure

```
whatdayisit/
├── src/
│   ├── content.js       # Main content script (source)
│   └── patterns/        # Date regex patterns
├── scripts/
│   └── build.js         # Bundler
├── tests/               # Unit tests & test page
├── assets/
│   └── store/           # Chrome Web Store assets
├── manifest.json        # Extension manifest
├── popup.html/js        # Settings popup
└── icon*.png            # Extension icons
```

## How It Works

1. Content script scans text nodes on page load
2. Combined regex pattern matches dates in various formats
3. Matched dates are wrapped with highlight and tooltip
4. MutationObserver handles dynamically loaded content (SPAs)

## Privacy

This extension:

- ❌ Does NOT collect any data
- ❌ Does NOT track browsing
- ❌ Does NOT make network requests
- ✅ Works entirely offline
- ✅ Stores only user preferences locally

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## License

MIT

## Author

Dawid Fajkowski
