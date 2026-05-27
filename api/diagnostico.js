// api/diagnostico.js — Vercel Serverless Function
// POST /api/diagnostico
// Recebe o JSON completo do formulário de diagnóstico e encaminha ao CRM.

'use strict';

const crm = require('../lib/crm');
const { readJsonBody, methodNotAllowed } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  let body;
  try { body = await readJsonBody(req); }
  catch { return res.status(400).json({ error: 'JSON inválido.' }); }

  const { formData, meta } = body || {};
  if (!formData) return res.status(400).json({ error: 'formData ausente' });

  const result = await crm.sendToCrm({
    event: 'diagnostico_submitted',
    source: 'formulario',
    submittedAt: new Date().toISOString(),
    meta: meta || {},
    formData,
  });

  if (result.skipped) {
    // CRM desativado ou sem configuração — aceitamos o envio mas avisamos
    // que o backend recebeu mas não retransmitiu. O frontend pode prosseguir.
    return res.status(200).json({ ok: true, forwarded: false, reason: result.error || 'crm_disabled' });
  }
  if (!result.ok) {
    return res.status(502).json({ ok: false, error: 'crm_forward_failed' });
  }
  return res.status(200).json({ ok: true, forwarded: true });
};
