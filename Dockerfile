FROM node:22.23.4-alpine AS builder
WORKDIR /usr/src/app

RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN npx prisma generate
RUN npm run build

FROM node:22.23.4-alpine AS production
WORKDIR /usr/src/app

RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/generated ./src/generated

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
