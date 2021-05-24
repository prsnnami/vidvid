const { createProxyMiddleware } = require('http-proxy-middleware');

function onProxyReq(proxyReq) {
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

// module.exports = function (app) {
//   app.use(
//     createProxyMiddleware('/proxy', {
//       target: 'http://localhost:8080',
//       pathRewrite: { '/proxy': '' },
//       changeOrigin: true,
//       onProxyReq,
//     })
//   );
//   app.use(
//     createProxyMiddleware('/borderer', {
//       target: 'http://reduct-experiments.humanassisted.ai/borderer',
//     })
//   );
// };
