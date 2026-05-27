// api/payment-status/[id].js — Vercel Serverless Function
// GET /api/payment-status/:id
// Consulta status do pagamento no Asaas (usado pelo polling do frontend).

'use strict';

const asaas = require('../../lib/asaas');
const { methodNotAllowed } = require('../_helpers');

module.exports = async function handler(req, res) {
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
