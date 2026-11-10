#!/bin/sh
# Point Tailscale Serve's /simtower mount at the running deploy.local container.
# deploy.local publishes the container on a random loopback port that changes
# with every deploy, so run this after each `deploy -a simtower`.
set -eu
tries=0
while :; do
  id=$(docker ps --filter label=deploy-sh.app=simtower --filter label=deploy-sh.component=web --format '{{.ID}}' | head -n 1)
  port=$([ -n "$id" ] && docker port "$id" 5173/tcp 2>/dev/null | head -n 1 | sed 's/.*://' || true)
  if [ -n "${port:-}" ] && curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:$port/simtower/"; then
    # A redeploy briefly runs old and new containers together; wait for one.
    [ "$(docker ps --filter label=deploy-sh.app=simtower --format '{{.ID}}' | wc -l)" -eq 1 ] && break
  fi
  tries=$((tries + 1))
  [ "$tries" -lt 60 ] || { echo "SimTower container did not become ready" >&2; exit 1; }
  sleep 2
done
tailscale serve --bg --set-path /simtower "http://127.0.0.1:$port/simtower"
