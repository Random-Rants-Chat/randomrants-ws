var WebSocket = require("ws");
var http = require("http");
var path = require("path");
var fs = require("fs");
var URL = require("url");
var ws = require("ws");
var websockets = {};
var mainws = null;

function waitForBody(req) {
  return new Promise((accept,reject) => {
    var chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      accept(Buffer.concat(chunks));
    });
    req.on("error", (e) => {
      reject(e);
    });
  })
}

function createWebsocket() {
  var wss = new ws.WebSocketServer({ noServer: true });
  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      try{
        var str = data.toString();
        
        wss.clients.forEach((cl) => {
          cl.send(str);
        });
      }catch(e){
        ws.close();
      }
    });
  });
  return wss;
}

function setNoCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
}
function runStaticStuff(req, res, forceStatus) {
  var url = URL.parse(req.url);
  var pathname = url.pathname;

  setNoCorsHeaders(res);

  var file = path.join("./static/", pathname);
  if (pathname == "/") {
    file = "static/index.html";
  }
  if (file.split(".").length < 2) {
    file += ".html";
  }

  if (!fs.existsSync(file)) {
    file = "errors/404.html";
    res.statusCode = 404;
  }

  if (typeof forceStatus !== "undefined") {
    file = "errors/" + forceStatus + ".html";
    res.statusCode = forceStatus;
  }

  fs.createReadStream(file).pipe(res);
}

async function handleHTTPRequest(req, res) {
  var url = decodeURIComponent(req.url);
  var urlsplit = url.split("/");
  
  if (urlsplit[1] == "createRoomCode") {
    var body = await waitForBody(req);
    
    var json = JSON.parse(body.toString());
    
    
    
    return;
  }
  
  runStaticStuff(req, res);
}

var server = http.createServer(handleHTTPRequest);

mainws = createWebsocket();

server.on("upgrade", function upgrade(request, socket, head) {
  var url = decodeURIComponent(request.url);
  var urlsplit = url.split("/");
  var id = urlsplit[1];
  if (websockets[id]) {
    var wss = websockets[id];
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else {
    mainws.handleUpgrade(request, socket, head, function done(ws) {
      mainws.emit("connection", ws, request);
    });
  }
});
server.listen(8080);
console.log("Server started!");
