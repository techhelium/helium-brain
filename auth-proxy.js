// Tiny auth proxy: validates Bearer token, forwards to supergateway on localhost:8788
import http from 'http';

const EXPECTED_TOKEN = process.env.HBRAIN_AUTH_TOKEN;
const UPSTREAM_HOST = 'localhost';
const UPSTREAM_PORT = 8788;
const LISTEN_PORT = process.env.PORT || 8787;

if (!EXPECTED_TOKEN) {
  console.error('FATAL: HBRAIN_AUTH_TOKEN not set');
  process.exit(1);
}

const server = http.createServer((clientReq, clientRes) => {
  // Allow health checks without auth (Heroku uses these)
  if (clientReq.url === '/health' || clientReq.url === '/') {
    clientRes.writeHead(200, { 'Content-Type': 'text/plain' });
    clientRes.end('ok');
    return;
  }

  // Validate Bearer token
  const authHeader = clientReq.headers['authorization'] || '';
  const expected = `Bearer ${EXPECTED_TOKEN}`;
  if (authHeader !== expected) {
    clientRes.writeHead(401, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'unauthorized', message: 'Valid Bearer token required' }));
    console.log(`[auth] 401 ${clientReq.method} ${clientReq.url}`);
    return;
  }

  // Forward to supergateway
  const options = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}` },
  };

  const upstreamReq = http.request(options, (upstreamRes) => {
    clientRes.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(clientRes);
  });

  upstreamReq.on('error', (err) => {
    console.error(`[auth] upstream error: ${err.message}`);
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'bad_gateway', message: err.message }));
  });

  clientReq.pipe(upstreamReq);
});

server.listen(LISTEN_PORT, () => {
  console.log(`[auth] listening on :${LISTEN_PORT}, forwarding to ${UPSTREAM_HOST}:${UPSTREAM_PORT}`);
});