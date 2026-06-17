FROM node:22-alpine AS ui-build

WORKDIR /app/ui

ENV VITE_API_BASE_URL=/api

COPY ui/package*.json ./
RUN npm ci

COPY ui ./
RUN npm run build

FROM node:22-alpine

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3033

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend ./
COPY --from=ui-build /app/ui/dist ./app

RUN mkdir -p data output logs && chown -R node:node /app/backend

USER node

EXPOSE 3033

CMD ["npm", "start"]
