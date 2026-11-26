# Event check-in

Check-in in Flyerrr uses **QR codes only** (issue #32, F6.3).

## How it works today

1. A student opens **Check In** in the bottom bar, picks the event, and taps **Show My Check-In QR**.
2. The app shows a check-in code tied to that student and event. It refreshes every 20 seconds, so an old screenshot will not validate.
3. An officer opens **Check In**, which shows Scanner Mode, enters the student's code, and taps **Validate Attendance**.

With the shared backend (`VITE_DATA_BACKEND=http`), the server issues the code, signs it, accepts it only once, and saves the attendance record (issue #18; see [the backend guide](bookmarks-backend.md)). In the offline demo mode, the code and the attendance record stay in that browser.

## Known gaps (tracked elsewhere)

- The code is drawn as a pattern made from its text, not a standard QR symbol, so a phone camera cannot scan it yet. The officer enters the text code shown under the pattern instead.
- The **Show Check-In QR** button on an event's page still issues a browser-only code, so with the shared backend an officer cannot redeem it. Use the Check In screen until that is fixed.
- The server does not store points, and students cannot yet read their own attendance from the server. That is part of #20.

## Why not NFC

The prototype had a "Simulate NFC Tap" button with no real NFC behind it. Web NFC only works in Chrome on Android, so it could not support an iPhone demo. The team decided to remove the simulation and make QR the only path. Real NFC can be revisited later, as long as it is feature-detected and falls back to QR.
