// Lokaler Testserver mit SPA-Fallback (wie online über api/page.js): node tools/serve.js [port]  →  http://localhost:8765
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), port = +process.argv[2] || 8765;
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain'};
http.createServer((req, res)=>{
  let f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if(!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if(fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if(!fs.existsSync(f)) f = path.join(root, fs.existsSync(path.join(root, 'app.html')) ? 'app.html' : 'index.html');
  res.writeHead(200, {'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(res);
}).listen(port, ()=>console.log(`TFTClimb lokal: http://localhost:${port}`));
