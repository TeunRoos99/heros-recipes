FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
COPY --from=client-build /app/client/build ./public
VOLUME ["/app/data"]
ENV PORT=3002
ENV DB_PATH=/app/data/inventory.db
ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "index.js"]
