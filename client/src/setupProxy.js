const { createProxyMiddleware } = require('http-proxy-middleware');

function onProxyReq(proxyReq, req, res) {
  // add custom header to request
  proxyReq.setHeader('origin', 'localhost');
  // or log the req
}

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/proxy', {
      target: 'http://localhost:8080/',
      pathRewrite: { '/proxy': '' },
      changeOrigin: true,
      onProxyReq,
    })
  );
  app.use(
    createProxyMiddleware('/borderer', {
      target: 'http://localhost:8000/',
    })
  );
};

// "proxy": {
//   "/proxy": {
//     "target": "http://localhost:8080/"
//   },
//   "/borderer": {
//     "target": "http://localhost:8000/"
//   }
// },
