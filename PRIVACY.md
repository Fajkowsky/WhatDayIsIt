# Privacy Policy for WhatDayIsIt

**Last updated:** October 25, 2026

## Overview

WhatDayIsIt is a Chrome extension that locally highlights dates in web page text and shows the corresponding weekday. The extension does not send page content to its developer or to a WhatDayIsIt server.

## Data Collection

**We do not collect page content or browsing data.**

Specifically, WhatDayIsIt:

- ❌ Does NOT collect or send page content or browsing history
- ❌ Does NOT track browsing activity
- ❌ Does NOT send page or browsing data to external servers
- ❌ Does NOT use analytics or tracking
- ✅ Stores only extension preferences using Chrome's Storage Sync API

## Data Storage

The extension stores only these preferences using Chrome's built-in `chrome.storage.sync` API: enabled/disabled state, highlight setting, and icon position. Chrome Sync may make these preferences available in the signed-in user's Chrome browsers, according to Chrome Sync settings. The extension developer does not receive them. The extension does not store dates or other page content.

- Is managed by Chrome Sync and the user's Chrome account settings
- Is not transmitted to WhatDayIsIt servers
- Can be reset or removed through Chrome's extension settings and Sync controls

## Permissions

The extension requires these permissions:

- **storage**: To save and synchronize the three preferences listed above

The content script is declared for web pages and processes their text in the browser. It makes no runtime network requests.

## Third Parties

The extension does not send page content or browsing history to third parties. Chrome Storage Sync may process and synchronize the saved preferences according to the user's Chrome Sync settings. The extension developer does not receive those preferences.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository.

---

**Summary: Page text is processed locally and is not collected. Only extension preferences are stored with Chrome Storage Sync.**
