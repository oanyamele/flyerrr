# Event check-in

Check-in in flyer uses **QR codes only** (issue #32, F6.3).

## How it works today

1. A student opens **Check In** in the bottom bar (or **Show Check-In QR** on an event they RSVPed to), picks the event, and taps **Show My Check-In QR**.
2. The app shows a check-in code tied to that student and event. It refreshes every 20 seconds, so an old screenshot will not validate.
3. An officer opens **Check In**, which shows Scanner Mode, enters the student's code, and taps **Validate Attendance**.

## Known gaps (tracked elsewhere)

- The code is drawn as a pattern made from its text, not a standard QR symbol, so a phone camera cannot scan it yet. The officer enters the text code shown under the pattern instead.
- A successful validation shows a confirmation but does not yet save an attendance record or award points. That is part of #20 and #24.

## Why not NFC

The prototype had a "Simulate NFC Tap" button with no real NFC behind it. Web NFC only works in Chrome on Android, so it could not support an iPhone demo. The team decided to remove the simulation and make QR the only path. Real NFC can be revisited later, as long as it is feature-detected and falls back to QR.
