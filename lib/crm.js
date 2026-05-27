// lib/crm.js
// Camada de integração com CRM. Server-side apenas.
//
// Comportamento:
//   - Se CRM_ENABLED != 'true', a função sendToCrm() é no-op (retorna { skipped: true }).
//   - Se CRM_ENABLED == 'true' e variáveis estão presentes, envia POST ao CRM.
//   - Se CRM_ENABLED == 'true' mas variáveis faltam, retorna erro controlado SEM
//     interromper o fluxo principal (chamada não-bloqueante).
//
// Variáveis de ambiente esperadas:
//   CRM_ENABLED         ('true' para ativar — qualquer outro valor = desativado)
//   CRM_API_URL         (URL completa do endpoint do CRM)
//   CRM_API_KEY         (chave/token de autenticação)
//   CRM_AUTH_HEADER     (header HTTP, padrão 'x-api-key')

'use strict';

function isCrmEnabled() {
  return String(process.env.CRM_ENABLED || '').toLowerCase().trim() === 'true';
}

function getCrmConfig() {
  return {
    url: process.env.CRM_API_URL,
    key: process.env.CRM_API_KEY,
    header: process.env.CRM_AUTH_HEADER || 'x-api-key',
  };
}

/**
 * Envia um payload para o CRM, se habilitado.
 * Sempre resolve — nunca lança erro para o caller, para não quebrar o fluxo principal.
 *
 * @param {object} payload  Objeto JSON-serializável a ser enviado.
 * @returns {Promise<{ok:boolean, skipped?:boolean, error?:string, status?:number}>}
 */
async function sendToCrm(payload) {
  if (!isCrmEnabled()) {
    return { ok: true, skipped: true };
  }

  const { url, key, header } = getCrmConfig();
  if (!url || !key) {
    console.warn('[crm] CRM_ENABLED=true mas CRM_API_URL ou CRM_API_KEY não configurados.');
    return { ok: false, skipped: true, error: 'crm_config_missing' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [header]: key,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[crm] HTTP', res.status, 'em', url);
      return { ok: false, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.warn('[crm] erro de rede:', err.message);
    return { ok: false, error: 'network_error' };
  }
}

module.exports = {
  isCrmEnabled,
  sendToCrm,
};
