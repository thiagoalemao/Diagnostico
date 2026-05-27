// api/payment-status/[id].js — Vercel Serverless Function
'use strict';

const asaas = require('../../lib/asaas');
const { cors, methodNotAllowed } = require('../_helpers');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const id = (req.query && req.query.id) || '';
  if (!id) return res.status(400).json({ error: 'ID do pagamento ausente.' });

  try {
    const data = await asaas.getPaymentStatus(id);
    if (!data || !data.id) return res.status(404).json({ status: 'NOT_FOUND' });
    return res.status(200).json({
      id: data.id,
      status: data.status,
      value: data.value,
      billingType: data.billingType,
      paidAt: data.paymentDate || data.clientPaymentDate || null,
    });
  } catch (err) {
    console.error('[payment-status]', err.code || '', err.message);
    return res.status(500).json({ error: 'Erro ao consultar status.' });
  }
};
