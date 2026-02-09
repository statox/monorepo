FROM node:24-alpine

WORKDIR /api

COPY . .

RUN npm ci
RUN npm run check

# CMD ["npm", "run", "serve"]

CMD ["npx",  "dotenvx",  "run",  "--",  "node",  "dist/index.js"]
