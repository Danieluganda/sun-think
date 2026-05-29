# Thinkific Sunbird

Admin dashboard and backend service for monitoring Thinkific and Sunbird translation activity.

## Start Everything

From this folder:

```bash
npm run dev
```

That starts both services:

- Backend API: `http://localhost:4100`
- Admin UI: `http://localhost:5173`
- Thinkific widget script: `http://localhost:4100/widget/language-switcher.js`

Stop both services with `Ctrl+C`.

## Other Commands

```bash
npm run build
npm test
npm run install:all
```

Use `npm run install:all` after cloning or when dependencies are missing.
