const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/servico_edicao',
    createProxyMiddleware({
      target: 'http://localhost:3014',
      changeOrigin: true
    })
  )
}
