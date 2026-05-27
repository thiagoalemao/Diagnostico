// server.js
// Servidor Express APENAS para desenvolvimento local.
// Em produção o projeto roda na Vercel via funções serverless em /api/*.
//
// Uso local:
//   cp .env.example .env   (e preencher)
//   npm install
//   npm run dev

'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');

const checkoutHandler = require('./api/checkout');
const paymentStatusHandler = require('./api/payment-status/[id]');
const webhookHandler = require('./api/webhook');
const diagnosticoHandler = require('./api/diagnostico');

const app = express();

// CORS permissivo apenas em dev (NODE_ENV !== 'production').
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, asaas-access-token');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

// Adapter: as funções da Vercel esperam req.query.id; o Express usa req.params.
function withVercelQuery(handler, paramMap = {}) {
  return (req, res) => {
    req.query = { ...req.query };
    for (const [vercelKey, expressKey] of Object.entries(paramMap)) {
      req.query[vercelKey] = req.params[expressKey];
    }
    return handler(req, res);
  };
}

app.post('/api/checkout', checkoutHandler);
app.get('/api/payment-status/:id', withVercelQuery(paymentStatusHandler, { id: 'id' }));
app.post('/api/webhook', webhookHandler);
app.post('/api/diagnostico', diagnosticoHandler);

// Estáticos (HTML/CSS/imagens da raiz)
app.use(express.static(path.join(__dirname)));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[dev] Servidor local na porta ${PORT}`);
});
