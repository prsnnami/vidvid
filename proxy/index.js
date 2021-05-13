// const express = require("express");
// const morgan = require("morgan");
// const { createProxyMiddleware } = require("http-proxy-middleware");

// // Create Express Server
// const app = express();

// app.use(morgan("dev"));

// // Configuration
// const PORT = 8000;
// const HOST = "localhost";
// const API_SERVICE_URL = "https://app.reduct.video/e/";

// app.use(
//   "/reduct",
//   createProxyMiddleware({
//     target: API_SERVICE_URL,
//     changeOrigin: true,
//     pathRewrite: {
//       [`^/reduct`]: "",
//     },
//     onProxyReq: function onProxyReq(proxyReq, req, res) {
//       // add custom header to request
//       proxyReq.setHeader("Access-Control-Allow-Origin", "*");
//       proxyReq.setHeader("Origin", "localhost:8000");
//       // or log the req
//     },
//   })
// );

// app.listen(PORT, HOST, () => {
//   console.log(`Starting Proxy at ${HOST}:${PORT}`);
// });

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(",");
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.

var cors_proxy = require("cors-anywhere");
cors_proxy
  .createServer({
    requireHeader: ["origin", "x-requested-with"],
    removeHeaders: [
      "cookie",
      "cookie2",
      // Strip Heroku-specific headers
      "x-request-start",
      "x-request-id",
      "via",
      "connect-time",
      "total-route-time",
      // Other Heroku added debug headers
      // 'x-forwarded-for',
      // 'x-forwarded-proto',
      // 'x-forwarded-port',
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
      xfwd: false,
    },
  })
  .listen(port, host, function () {
    console.log("Running CORS Anywhere on " + host + ":" + port);
  });
