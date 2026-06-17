# Email Draft: Thinkific Translation Widget Release

Subject: Thinkific Translation Widget Deployed for 10X Academy

Hi team,

The Thinkific translation widget has now been deployed for the 10X Academy course experience.

Learners can use the floating language button on the course page to translate visible course content into the supported local languages. The widget is connected to our Azure-hosted backend and integrated with the Sunbird Translation API.

We have also added tracking for the translation feature so we can see usage activity such as when a learner opens the language menu, selects a language, completes a translation, or encounters a translation error. Where available, this includes useful context such as the page URL, selected language, visitor ID, browser details, and user email.

One important limitation to note: the current Sunbird API key has a daily quota limit. During testing, the API returned a `429 Daily quota exceeded` response, which means translations can stop working once the daily token/quota allocation has been used. The widget itself is live, but translation availability depends on the Sunbird API quota.

Recommended next steps are:

- Request a production quota increase or paid API plan from Sunbird.
- Confirm Sunbird's daily/monthly limits and rate limits.
- Add a fallback provider, such as Google Cloud Translation, for supported languages.
- Decide whether long-term translation usage analytics should be stored persistently.

In short, the integration is deployed and ready, but production use will require a larger or more reliable translation quota from Sunbird.

Best,

