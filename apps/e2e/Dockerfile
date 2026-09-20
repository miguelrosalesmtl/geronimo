# Playwright's Microsoft image ships matching browsers + OS deps for the
# exact @playwright/test version below — keep these two pinned together.
FROM mcr.microsoft.com/playwright:v1.63.0-jammy

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json tsconfig.build.json playwright.config.ts ./
COPY config ./config
COPY fixtures ./fixtures
COPY tests ./tests
COPY report ./report
RUN npm run build

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
