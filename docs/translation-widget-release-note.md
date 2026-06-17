# Translation Widget Release Note

## Release Summary

The Thinkific translation widget has been deployed for the 10X Academy course experience. Learners can now use the floating language button on the course page to translate visible course content into supported local languages.

## What Was Delivered

- Added a floating translation button to the Thinkific course pages.
- Connected the widget to the deployed Azure backend:
  `https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net`
- Integrated Sunbird Translation API for local-language translation.
- Added language selection support for the configured course source language.
- Added user footprint tracking for translation activity, including:
  - language menu opened
  - language selected
  - translation completed
  - translation failed
  - page URL, page title, visitor ID, user email when available, browser, viewport, and language choice
- Added dashboard visibility for recent translation widget activity.
- Improved error handling so learners see a clearer message when translation is unavailable.

## Current Limitation

The Sunbird Translation API key currently has a daily quota limit. During testing, the API returned:

`429 Daily quota exceeded`

This means the widget is installed and working, but translations may fail once the daily Sunbird quota has been used up. When that happens, learners may see a message indicating that the daily translation quota has been reached.

## Recommended Next Steps

- Contact Sunbird to request a production quota increase or paid API plan.
- Confirm daily/monthly character limits and rate limits for the API key.
- Add a fallback translation provider, such as Google Cloud Translation, for supported languages.
- Add persistent analytics storage if long-term reporting is required beyond the current dashboard session data.

