# Thinkific Sunbird

Admin dashboard, backend API, and Thinkific floating translation widget for the 10X Academy course experience.

The live widget is served from Azure and embedded in Thinkific as a green floating **Language** button in the lower-right corner of the course page.

## Current Status

This project is ready to pause after the pilot deployment.

What is complete:

- Thinkific widget is live.
- Azure backend is deployed and healthy.
- Sunbird is the active translation provider.
- Google Cloud Translation fallback is disabled to avoid billing.
- Translation cache is enabled for repeated course text.
- Widget analytics are saved to persistent JSON storage.
- Controlled backend concurrency is enabled for uncached translations.
- Pre-translation command is available, but should only be run when Sunbird quota is available.

Before full-scale launch, management needs to approve or provide:

- more Sunbird quota/credits or a production Sunbird agreement
- a decision on which languages to pre-translate first
- approval for any future scale services, such as Redis, database storage, queueing, or autoscaling
- load testing before opening to a large audience

## Live Deployment

- Azure app: `https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net`
- Health check: `https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/health`
- Widget script: `https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/widget/language-switcher.js`
- Thinkific course page: `https://10xacademy.outbox.africa/courses/10x-foundation-course`

## What This App Does

- Serves the Thinkific language switcher widget.
- Translates visible Thinkific course text through the Sunbird Translation API.
- Caches translated course text so repeated text does not call Sunbird again.
- Runs uncached translation requests with controlled backend concurrency.
- Has optional Google Cloud Translation fallback code, disabled by default.
- Tracks widget usage events such as menu opens, language selections, completed translations, and failed translations.
- Stores widget visitor/user analytics in a JSON file.
- Provides an admin UI and `/api/metrics` endpoint for monitoring API health and widget activity.

## Local Setup

From this folder:

```bash
npm run install:all
npm run dev
```

That starts both services:

- Backend API: `http://localhost:4100`
- Admin UI: `http://localhost:5173`
- Local widget script: `http://localhost:4100/widget/language-switcher.js`

Stop both services with `Ctrl+C`.

## Environment Variables

Backend configuration is read from `backend/.env` locally or Azure App Service settings in production.

Required for production translation:

```bash
SUNBIRD_API_URL=https://api.sunbird.ai/tasks/translate
SUNBIRD_API_KEY=...
```

Required for Thinkific API operations:

```bash
THINKIFIC_GRAPHQL_URL=https://api.thinkific.com/stable/graphql
THINKIFIC_TOKEN=...
```

Optional:

```bash
API_TOKEN=...
DB_PATH=./data/jobs.db
OUTPUT_DIR=./output
LOG_DIR=./logs
WIDGET_ANALYTICS_PATH=./data/widget-analytics.json
WIDGET_ANALYTICS_MAX_EVENTS=5000
WIDGET_ANALYTICS_FLUSH_MS=1000
TRANSLATION_CACHE_PATH=./data/translation-cache.json
TRANSLATION_CACHE_MAX_ENTRIES=20000
TRANSLATION_CONCURRENCY=3
GOOGLE_TRANSLATE_ENABLED=false
GOOGLE_TRANSLATE_API_KEY=...
GOOGLE_TRANSLATE_API_URL=https://translation.googleapis.com/language/translate/v2
```

In Azure, persistent storage paths are set to:

```bash
WIDGET_ANALYTICS_PATH=/home/data/widget-analytics.json
TRANSLATION_CACHE_PATH=/home/data/translation-cache.json
```

That keeps widget analytics and cached translations on App Service persistent storage instead of inside the replaceable container filesystem.

## Thinkific Widget

The Thinkific custom-code snippet is kept in:

```bash
scripts/thinkific-custom-code.html
```

The production snippet includes:

```html
<script>
  window.THINKIFIC_SUNBIRD_SOURCE_LANGUAGE = "eng";
</script>
<script src="https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/widget/language-switcher.js" defer></script>
```

## Analytics Storage

Widget activity is saved to JSON. The stored data includes:

- total widget events
- unique visitor IDs
- identified user emails when Thinkific exposes them
- language selections
- completed translations
- failed translations
- top languages
- per-visitor activity
- recent widget events

The JSON file is ignored by Git so learner/user data is not committed.

## Translation Cache

Translated text is cached by source language, target language, and normalized source text.

If one learner translates `Course Curriculum` into Luganda, the next learner requesting that same text gets the cached translation instead of making another Sunbird API call. This improves speed and reduces Sunbird quota usage.

The cache is stored at:

```bash
backend/data/translation-cache.json
```

In Azure, it is stored at:

```bash
/home/data/translation-cache.json
```

## Pre-Translation

Known Thinkific course text can be pre-translated into the cache before learners use the widget.

From `backend/`:

```bash
npm run pretranslate:widget -- --slug 10x-foundation-course --languages lug,ach --concurrency 3
```

Options:

- `--course <courseId>` warms one Thinkific course by ID.
- `--slug <courseSlug>` warms one Thinkific course by slug.
- `--languages lug,ach,teo,lgg,nyn` limits target languages.
- `--concurrency 3` controls how many uncached translation calls run at once.

The command uses the same backend translation cache as the live widget.

## Testing

Useful checks:

```bash
npm test
npm run build
```

Live smoke checks:

```bash
curl https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/health
curl https://mail-verify-hmhah3c7fbbgf9f4.canadacentral-01.azurewebsites.net/api/metrics
```

Manual widget test:

1. Open `https://10xacademy.outbox.africa/courses/10x-foundation-course`.
2. Find the green **Language** button at the lower-right corner.
3. Open the language menu.
4. Select a language.
5. Confirm translation behavior and check `/api/metrics` for widget activity.

More details are in:

- `docs/translation-widget-test-guide.md`
- `docs/translation-widget-release-note.md`
- `docs/translation-widget-email-draft.md`

## Deployment

The app is containerized with `Dockerfile`.

Production deployment currently uses Azure Container Registry and Azure App Service:

```bash
az acr build --registry cformsliveacr --image mail-verify:<tag> --no-logs .
az webapp config container set --name mail-verify --resource-group 3534535243_group --container-image-name cformsliveacr.azurecr.io/mail-verify:<tag>
az webapp restart --name mail-verify --resource-group 3534535243_group
```

Use a new image tag for each deployment.

## Known Limitation

The Sunbird API key currently has a daily quota. When the quota is exhausted, translation requests can fail with:

```text
429 Daily quota exceeded
```

The widget remains live and tracks the failed event, but translation availability depends on Sunbird quota.

Google Cloud Translation fallback is disabled by default to avoid unexpected billing.

It only runs if all of these are true:

- `GOOGLE_TRANSLATE_ENABLED=true`
- `GOOGLE_TRANSLATE_API_KEY` is configured
- the language pair has a safe mapping

The current fallback mapping supports:

- `eng` to `ach`
- `eng` to `lug`
- `eng` to `swa`

Languages without a safe fallback mapping still depend on Sunbird.
