FROM node:22-alpine AS frontend-build

WORKDIR /app
RUN corepack enable

# Install from the exact committed JavaScript toolchain and lifecycle policy.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Vite, PostCSS, Tailwind and the public route/logo assets are build inputs.
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY client ./client
COPY public ./public
RUN pnpm build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run the production application as the unprivileged Node user.
RUN corepack enable && chown node:node /app
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
USER node
RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node server ./server
COPY --from=frontend-build --chown=node:node /app/client/dist ./client/dist

EXPOSE 3000
CMD ["pnpm", "start"]
