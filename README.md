# TimeFlip Browser Extension

TimeFlip is a lightweight Chromium extension for working with Unix timestamps.

## Features

- Convert Unix timestamp to date and time (`YYYY-MM-DD HH:mm:ss`)
- Supports both seconds and milliseconds input for timestamp conversion
- Convert date/time (`datetime-local`) to Unix timestamp
- Shows both seconds and milliseconds for date-to-timestamp conversion
- Timezone selector from `UTC-12` to `UTC+14` (`UTC+0` by default)
- Stores selected timezone in `chrome.storage.local`
- Stores last 10 operations in history
- Click history items to re-fill the corresponding form
- Clear history button
- Instant recalculation, inline validation, Enter key support, autofocus on first field

## Tech Stack

- Manifest V3
- Popup-based UI
- Vanilla JavaScript (ES6), HTML, CSS
- No backend
- No third-party libraries

## Project Structure

```text
time_flip/
  manifest.json
  popup.html
  popup.css
  popup.js
  icon16.png
  icon48.png
  icon128.png
```

## Install in Google Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this folder: `/time_flip/time_flip`.
5. Pin **TimeFlip** from the extensions menu if needed.

## Install in Arc

1. Open Arc and go to `arc://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `/time_flip/time_flip`.
5. Open the extension popup from Arc’s extensions menu.

## Usage

1. Choose a timezone.
2. Use **Timestamp to Date** for Unix timestamp input.
3. Use **Date to Timestamp** for `datetime-local` input.
4. Reuse previous conversions from **History**.
