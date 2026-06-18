# Translation Widget Release Note

## Release Summary

The Thinkific translation widget has been deployed for the 10X Academy course experience. Learners can now use the floating language button on the course page to translate visible course content into supported local languages.

This release is suitable for a pilot or controlled rollout. Full-scale rollout should wait until Sunbird quota/credits and load-testing requirements are confirmed.

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
- Added persistent JSON analytics for widget visitors, identified users, language selections, completed translations, and failed translations.
- Added a persistent translation cache so repeated course text can be reused without calling Sunbird again.
- Added controlled backend concurrency for uncached translation requests.
- Added a pre-translation command for warming the cache with known Thinkific course content.
- Added optional Google Cloud Translation fallback code, but kept it disabled by default to avoid unexpected billing.

## Current Limitation

The Sunbird Translation API key currently has a daily quota limit. During testing, the API returned:

`429 Daily quota exceeded`

This means the widget is installed and working, but translations may fail once the daily Sunbird quota has been used up. When that happens, learners may see a message indicating that the daily translation quota has been reached.

Google Cloud Translation fallback is currently disabled. The production system will continue to rely on Sunbird and cached translations unless management approves another provider.

The JSON cache and analytics storage are appropriate for the current pilot stage. For very large traffic, future work should move cache and analytics into managed services such as Redis, queue storage, and a database.

## Recommended Next Steps

- Contact Sunbird to request a production quota increase or paid API plan.
- Confirm daily/monthly character limits and rate limits for the API key.
- Run the pre-translation command once Sunbird quota is available.
- Decide which languages should be warmed first.
- Run cached-translation load testing before a large audience launch.
- Only add paid fallback providers after management approval.
- Consider Redis, queue storage, and database-backed analytics before full-scale launch.

## Close-Out Status

The implementation is complete and deployed for the current phase. The project can be paused while waiting for management to approve additional Sunbird credits/quota or scale-up budget.
