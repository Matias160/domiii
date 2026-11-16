const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript','.png':'image/png','.gif':'image/gif','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400);res.end();return; }
  if(pathname.split('/').some(part=>part.startsWith('.'))||/^\/(server|node_modules|tests|tools)\//.test(pathname)){res.writeHead(403);res.end();return;}
  const file = path.resolve(__dirname, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(__dirname + path.sep)||!types[path.extname(file)]) { res.writeHead(403);res.end();return; }
  fs.readFile(file,(err,data) => {
    if (err) { res.writeHead(404);res.end();return; }
    res.writeHead(200,{'Content-Type':(types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8','Cache-Control':'no-store'});
    res.end(data);
  });
});
let port = Number(process.env.PORT)||4177;
const host=process.env.HOST||'127.0.0.1';
server.on('error', error => {
  if(error.code === 'EADDRINUSE' && !process.env.PORT && port < 4190) server.listen(++port,host);
  else throw error;
});
server.on('listening',() => console.log(`http://${host}:${port}/ · Salas cooperativas activas`));
import('./server/rooms.js').then(({attachRooms})=>{attachRooms(server);server.listen(port,host);}).catch(error=>{console.error(error);process.exitCode=1;});
