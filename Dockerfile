# docker run -it node:13-alpine /bin/bash
# ---- Base Node ----
FROM node:13-alpine AS base
# Preparing
RUN mkdir -p /var/app && chown -R node /var/app
# Set working directory
WORKDIR /var/app
# Copy project file
COPY . .

ENV NODE_ENV=production
RUN apk add --update bash curl && rm -rf /var/cache/apk/*
RUN npm ci --only=prod --silent
# EXPOSE 3000
# HEALTHCHECK --interval=30s --timeout=5s CMD curl --fail http://0.0.0.0:3000 || exit 1
CMD node --experimental-loader ./resolver.mjs --experimental-modules server.mjs
