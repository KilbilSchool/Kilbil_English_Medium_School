FROM node:20-slim
ENV PORT=3000
EXPOSE 3000
WORKDIR /app
COPY . .
RUN npm ci --only=production
USER node
CMD ["node", "server.js"]
