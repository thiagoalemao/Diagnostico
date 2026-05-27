// api/webhook.js — Vercel Serverless Function
// POST /api/webhook
// Recebe notificações de pagamento do Asaas.
// Configure no painel Asaas → Integrações → Webhooks:
//   URL:   https://SEU_DOMINIO/api/webhook
//   Token: o mesmo valor de ASAAS_WEBHOOK_TOKEN nas variáveis de ambiente

'use strict';

const crm = require('../lib/crm');
const { readJsonBody, methodNotAllowed } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  // Validação de token, se configurado. Sem token => aceita (com aviso).
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expectedToken) {
    const received = req.headers['asaas-access-token'] || req.headers['Asaas-Access-Token'];
    if (received !== expectedToken) {
      console.warn('[webhook] token inválido');
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  let body;
  try { body = await readJsonBody(req); }
  catch { return res.status(400).json({ error: 'JSON inválido.' }); }

  const { event, payment } = body || {};

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    crm.sendToCrm({
      event: 'payment_confirmed',
      source: 'diagnostico',
      timestamp: new Date().toISOString(),
      asaasPaymentId: payment && payment.id,
      value: payment && payment.value,
      billingType: payment && payment.billingType,
      customer: payment && payment.customer,
    }).catch(() => { /* silencioso */ });
  }

  return res.status(200).json({ received: true });
};
