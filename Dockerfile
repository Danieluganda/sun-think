FROM node:22-alpine

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3033

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend ./

RUN mkdir -p data output logs && chown -R node:node /app/backend

USER node

EXPOSE 3033

CMD ["npm", "start"]
