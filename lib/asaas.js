// lib/asaas.js
// Cliente Asaas. Server-side apenas — nunca importar do frontend.
//
// Variáveis de ambiente esperadas:
//   ASAAS_API_KEY        (obrigatória)
//   ASAAS_ENVIRONMENT    ('production' (padrão) ou 'sandbox')
//   ASAAS_BASE_URL       (opcional — sobrescreve a URL derivada do ambiente)

'use strict';

const PRICE_CARD = 197.00;
const PRICE_PIX = 187.15;            // 5% de desconto no Pix
const PRICE_INSTALLMENT_VALUE = 19.70;
const PRICE_INSTALLMENT_COUNT = 10;
const PRODUCT_DESCRIPTION = 'Diagnóstico Financeiro Vet';

function resolveEnvironment() {
  const env = (process.env.ASAAS_ENVIRONMENT || process.env.ASAAS_ENV || 'production')
    .toLowerCase()
    .trim();
  return env === 'sandbox' ? 'sandbox' : 'production';
}

function resolveBaseUrl() {
  if (process.env.ASAAS_BASE_URL) return process.env.ASAAS_BASE_URL.replace(/\/$/, '');
  return resolveEnvironment() === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

function assertApiKey() {
  if (!process.env.ASAAS_API_KEY) {
    const err = new Error('ASAAS_API_KEY não configurada no ambiente.');
    err.code = 'ASAAS_KEY_MISSING';
    throw err;
  }
}

function asaasHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY,
    'User-Agent': 'diagnostico-financeiro-vet/1.0',
  };
}

async function asaasFetch(path, init = {}) {
  assertApiKey();
  const url = `${resolveBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...asaasHeaders(), ...(init.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* corpo vazio é aceitável */ }
  if (!res.ok) {
    const description = data && data.errors && data.errors[0] && data.errors[0].description;
    const err = new Error(description || `Asaas ${res.status} em ${path}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

async function findOrCreateCustomer({ name, email, phone, cpfCnpj }) {
  const cleanDoc = String(cpfCnpj || '').replace(/\D/g, '');
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  const search = await asaasFetch(`/customers?email=${encodeURIComponent(email)}&limit=1`);
  if (search && Array.isArray(search.data) && search.data.length > 0) {
    const existing = search.data[0];
    if (cleanDoc && !existing.cpfCnpj) {
      await asaasFetch(`/customers/${existing.id}`, {
        method: 'POST',
        body: JSON.stringify({ cpfCnpj: cleanDoc }),
      });
    }
    return existing.id;
  }

  const created = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      cpfCnpj: cleanDoc,
      mobilePhone: cleanPhone,
      notificationDisabled: false,
    }),
  });
  if (!created || !created.id) {
    throw new Error('Falha ao criar cliente no Asaas.');
  }
  return created.id;
}

async function createPixCharge(customerId, dueDate) {
  return asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: PRICE_PIX,
      dueDate,
      description: PRODUCT_DESCRIPTION,
      externalReference: `dfv-pix-${Date.now()}`,
    }),
  });
}

async function createCardCharge(customerId, dueDate) {
  return asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: PRICE_CARD,
      dueDate,
      description: PRODUCT_DESCRIPTION,
      externalReference: `dfv-card-${Date.now()}`,
    }),
  });
}

async function getPixQrCode(paymentId) {
  return asaasFetch(`/payments/${paymentId}/pixQrCode`);
}

async function getPaymentStatus(paymentId) {
  return asaasFetch(`/payments/${paymentId}`);
}

module.exports = {
  PRICE_CARD,
  PRICE_PIX,
  PRICE_INSTALLMENT_VALUE,
  PRICE_INSTALLMENT_COUNT,
  PRODUCT_DESCRIPTION,
  resolveEnvironment,
  resolveBaseUrl,
  findOrCreateCustomer,
  createPixCharge,
  createCardCharge,
  getPixQrCode,
  getPaymentStatus,
};
