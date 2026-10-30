const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript'};
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400);res.end();return; }
  const file = path.resolve(__dirname, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(__dirname + path.sep)) { res.writeHead(403);res.end();return; }
  fs.readFile(file,(err,data) => {
    if (err) { res.writeHead(404);res.end();return; }
    res.writeHead(200,{'Content-Type':(types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8','Cache-Control':'no-store'});
    res.end(data);
  });
});
let port = 4177;
server.on('error', error => {
  if(error.code === 'EADDRINUSE' && port < 4190) server.listen(++port,'127.0.0.1');
  else throw error;
});
server.on('listening',() => console.log(`http://127.0.0.1:${port}/`));
server.listen(port,'127.0.0.1');
