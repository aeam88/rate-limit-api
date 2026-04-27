FROM node:18-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl


COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate
COPY . .

RUN npm run build
FROM node:18-alpine AS production
WORKDIR /usr/src/app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /usr/src/app/dist ./dist

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
