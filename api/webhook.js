// api/webhook.js — Vercel Serverless Function
'use strict';

const crm = require('../lib/crm');
const { cors, readJsonBody, methodNotAllowed } = require('./_helpers');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

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
    }).catch(() => {});
  }

  return res.status(200).json({ received: true });
};
