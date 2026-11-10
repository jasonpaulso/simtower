FROM node:22-alpine AS prefixed
WORKDIR /build
COPY package.json index.html style.css ./
COPY src ./src
COPY public ./public
COPY tools/build.mjs tools/build-base.mjs ./tools/
RUN BASE_PATH=/simtower/ node tools/build.mjs

FROM node:22-alpine
WORKDIR /app
COPY package.json index.html style.css ./
COPY src ./src
COPY public ./public
COPY tools/server.mjs ./tools/server.mjs
# Second copy with URLs rebased under /simtower/, for the Tailscale Serve mount.
COPY --from=prefixed /build/dist ./dist
ENV HOST=0.0.0.0 PORT=5173 BASE_PATH=/simtower/
EXPOSE 5173
USER node
CMD ["node", "tools/server.mjs"]
