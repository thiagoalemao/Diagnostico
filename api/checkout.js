// api/checkout.js — Vercel Serverless Function
'use strict';

const asaas = require('../lib/asaas');
const crm = require('../lib/crm');
const { cors, readJsonBody, methodNotAllowed, tomorrowDate, daysFromNow } = require('./_helpers');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  let body;
  try { body = await readJsonBody(req); }
  catch { return res.status(400).json({ error: 'JSON inválido.' }); }

  const { name, email, phone, perfil, cpfCnpj } = body || {};
  if (!name || !email || !phone || !cpfCnpj) {
    return res.status(400).json({ error: 'Dados obrigatórios: name, email, phone, cpfCnpj' });
  }
  const cleanDoc = String(cpfCnpj).replace(/\D/g, '');
  if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
    return res.status(400).json({ error: 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.' });
  }

  try {
    crm.sendToCrm({
      event: 'checkout_started',
      source: 'diagnostico',
      submittedAt: new Date().toISOString(),
      lead: { name, email, phone, perfil: perfil || 'desconhecido', cpfCnpj: cleanDoc },
    }).catch(() => {});

    const customerId = await asaas.findOrCreateCustomer({ name, email, phone, cpfCnpj: cleanDoc });
    const pixDue = tomorrowDate();
    const cardDue = daysFromNow(3);

    const [pixCharge, cardCharge] = await Promise.all([
      asaas.createPixCharge(customerId, pixDue),
      asaas.createCardCharge(customerId, cardDue),
    ]);

    const pixQr = await asaas.getPixQrCode(pixCharge.id);

    return res.status(200).json({
      pixPaymentId: pixCharge.id,
      cardPaymentId: cardCharge.id,
      pixQrCodeImage: pixQr.encodedImage,
      pixCode: pixQr.payload,
      pixValue: asaas.PRICE_PIX,
      pixExpires: pixDue,
      invoiceUrl: cardCharge.invoiceUrl,
      cardValue: asaas.PRICE_CARD,
      installmentValue: asaas.PRICE_INSTALLMENT_VALUE,
      installmentCount: asaas.PRICE_INSTALLMENT_COUNT,
    });
  } catch (err) {
    console.error('[checkout]', err.code || '', err.message);
    if (err.code === 'ASAAS_KEY_MISSING') {
      return res.status(500).json({ error: 'Serviço de pagamento indisponível no momento. Tente novamente em instantes.' });
    }
    return res.status(500).json({ error: err.message || 'Erro ao processar checkout. Tente novamente.' });
  }
};
