FROM node:22-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
# For Prisma 7 with prisma.config.ts, we need the env var during generation
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
# Prisma 7 needs the config file as well
COPY prisma.config.ts ./

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
# If you are using custom output for prisma client, make sure it is included
COPY --from=builder /usr/src/app/src/generated ./src/generated

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
