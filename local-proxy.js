const http = require("http");
const httpProxy = require("http-proxy");
const fs = require("fs");
const url = require("url");
const path = require("path");
const mime = require("mime-types");

// Create a proxy server with custom application logic

// Create an HTTP server
const server = http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url);
  const localPath = req.url.slice(1);

  if (fs.existsSync(localPath)) {
    // If the file exists locally, serve it from disk
    fs.readFile(localPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error getting the file: ${err}.`);
      } else {
        console.log("Serving local file: " + localPath);
        var contentType = mime.contentType(
          mime.lookup(url.parse(req.url).pathname) || "application/octet-stream"
        );
        if (
          parsedUrl.pathname ==
          "/dev.virtualearth.net/REST/V1/Imagery/Metadata/Aerial/0,0"
        ) {
          contentType = mime.contentType("js");
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  } else {
    console.log("Proxy for " + localPath);

    let proxy = httpProxy.createProxyServer({});
    let domain = parsedUrl.pathname.split("/")[1];
    if (
      [
        "worldwind26.arc.nasa.gov",
        "dev.virtualearth.net",
        "ecn.t3.tiles.virtualearth.net",
      ].includes(domain)
    ) {
      // If the file doesn't exist, forward the request and cache the response
      req.url = req.url.slice(domain.length + 1);
      proxy.on("proxyRes", function (proxyRes, req, res) {
        var body = [];
        proxyRes.on("data", function (chunk) {
          body.push(chunk);
        });
        proxyRes.on("end", function () {
          fs.promises
            .mkdir(path.dirname(localPath), { recursive: true })
            .then((x) => {
              fs.writeFile(localPath, Buffer.concat(body), function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Saved file: " + localPath);
                }
              });
            });
        });
      });

      proxy.web(req, res, {
        target: "https://" + domain,
        hostRewrite: true,
        protocolRewrite: true,
        changeOrigin: true,
      });
    } else {
      console.log("can't proxy this domain: " + domain);
      res.writeHead(404);
      res.end("File not found and unable to proxy the request.");
    }
  }
});

console.log("Listening on port 8000");
server.listen(8000);
