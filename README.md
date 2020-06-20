# Environment variables

Copy `./.env.sample` to `./.env` end make sure all variables are set.

# Start server

```bash
npm ci
node --experimental-loader ./resolver.mjs --experimental-modules server.mjs
```
or
```
npm ci
npm start
```

# Build image

```bash
docker build ./ -t frontendermagazine/analyze --label frontendermagazine
```
or
```bash
npm run build
```

# Publish

```bash
docker login
docker push frontendermagazine/analyze
```
or
```bash
docker login
npm run publish
```
