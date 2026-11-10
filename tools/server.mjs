import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
// Optional: also serve a `BASE_PATH=/prefix/ npm run build` output from dist/
// under that prefix, for proxies that mount the game on a sub-path.
const base = process.env.BASE_PATH && process.env.BASE_PATH !== '/' ? process.env.BASE_PATH : null;
const dist = resolve(root, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.wav': 'audio/wav' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (base && pathname === base.slice(0, -1)) { res.writeHead(302, { Location: base }).end(); return; }
    const prefixed = Boolean(base) && pathname.startsWith(base);
    if (prefixed) pathname = pathname.slice(base.length - 1);
    const dir = prefixed ? dist : root;
    const relative = !prefixed && pathname.startsWith('/assets/') ? `/public${pathname}` : pathname;
    const path = resolve(dir, `.${relative === '/' ? '/index.html' : relative}`);
    if (!path.startsWith(dir + sep) || !/^\/(index\.html|src\/|assets\/|style\.css|$)/.test(pathname)) {
      res.writeHead(404).end('Not found'); return;
    }
    if (!(await stat(path)).isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, host, () => console.log(`SimTower: http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`));
