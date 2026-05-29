# Thinkific Sunbird Backend

Node.js backend for fetching Thinkific course captions, translating SRT text through Sunbird, tracking jobs, and exporting generated subtitle files.

## Commands

```bash
npm --prefix .. run dev
npm install
npm run dev
npm run cli -- status
npm test
```

From the project root, prefer `npm run dev` to start both the backend and UI together.

Copy `.env.example` to `.env` and fill in `THINKIFIC_TOKEN`, `SUNBIRD_KEY`, and service URLs before connecting to live APIs.

## API

- `GET /health`
- `GET /api/courses`
- `GET /api/courses/:courseId/lessons`
- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/jobs/:jobId/retry`
- `GET /api/progress`
- `GET /api/export/json`
- `GET /api/export/csv`

## Thinkific language switcher

Add this in the Thinkific page/theme custom code, replacing the host with the public URL where this backend is deployed:

```html
<script>
  window.THINKIFIC_SUNBIRD_SOURCE_LANGUAGE = "eng";
</script>
<script src="https://your-backend-domain.com/widget/language-switcher.js" defer></script>
```

The widget loads available languages from `GET /public/languages`. If there are many languages, it renders a dropdown automatically.

For the current Sunbird NLLB translation endpoint, the live translation dropdown is limited to the codes documented for `/tasks/nllb_translate`: `ach`, `teo`, `eng`, `lug`, `lgg`, and `nyn`.

For local testing only, use:

```html
<script src="http://localhost:4100/widget/language-switcher.js" defer></script>
```

Do not use `localhost` for a live Thinkific site because visitors' browsers cannot reach your computer.
