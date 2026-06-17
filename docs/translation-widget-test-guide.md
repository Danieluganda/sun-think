# Translation Widget: How to Use and Test

## Test Page

Use the 10X Academy course page:

`https://10xacademy.outbox.africa/courses/10x-foundation-course`

## How to Use the Feature

1. Open the course page in a browser.
2. Look for the green floating **Language** button at the lower-right corner of the page.
   It appears beside the purple accessibility button.
3. Click the button to open the language menu.
4. Select one of the available languages.
5. Wait for the page content to update.
6. Confirm that visible course text changes to the selected language.

## What Should Happen

- The green floating **Language** button should appear at the lower-right corner of the page.
- Clicking the button should open the language menu.
- Selecting a language should show a translating state.
- Visible text on the page should change to the selected language.
- The widget should track usage activity in the backend/dashboard.

## What to Check in the Browser

Open browser developer tools and check the following:

1. Console
   - There should be no JavaScript errors from `language-switcher.js`.

2. Network
   - Confirm this script loads successfully:
     `https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/widget/language-switcher.js`
   - Confirm translation requests are sent to the Azure backend.
   - Confirm widget event requests are sent when the button is used.

3. Page behavior
   - The page should remain usable after translation.
   - Buttons, links, video controls, forms, and menus should not break.
   - The widget should not translate hidden technical text, scripts, or form values.

## How to Confirm Usage Tracking

Use the monitoring dashboard or backend metrics endpoint to confirm recent widget activity.

Widget analytics are also saved as a JSON file on the backend. By default, the file is:

`backend/data/widget-analytics.json`

This path can be changed with the `WIDGET_ANALYTICS_PATH` environment variable.

Expected tracked events include:

- `Menu Opened`
- `Language Selected`
- `Translation Completed`
- `Translation Failed`

The tracking payload may include:

- visitor ID
- user email, when Thinkific exposes it
- selected language
- page URL
- page title
- browser user agent
- viewport size
- translation status
- error details, if translation fails

The stored JSON includes summary counts, unique visitor IDs, identified user emails when available, language counts, per-visitor activity, and recent widget events.

## Known Issue: Sunbird Quota

The current Sunbird API key has a daily quota limit.

If the quota has been used up, translation requests may fail with:

`429 Daily quota exceeded`

In that case:

- The green floating **Language** button may still appear.
- The language menu may still open.
- The selected language may not translate the page.
- The widget should show a clear quota-related error instead of silently failing.
- A `Translation Failed` event should be tracked.

## Pass Criteria

The feature can be considered working if:

- The green floating **Language** button loads on the Thinkific course page.
- The language menu opens.
- A language can be selected.
- Translation succeeds when Sunbird quota is available.
- A clear error appears when Sunbird quota is exhausted.
- Widget usage events appear in the monitoring data.

## Fail Criteria

The feature needs investigation if:

- The green floating **Language** button does not appear at the lower-right corner.
- `language-switcher.js` fails to load.
- Selecting a language does nothing.
- The page layout breaks after translation.
- No widget usage events are recorded.
- Translation fails even when the Sunbird quota is available.
