# Diagnóstico Financeiro Vet

Landing page + checkout Asaas + formulário de diagnóstico para o serviço de **Thiago Alemão — Gestão Empresarial Veterinária**.

Stack: HTML estático + funções serverless Node.js (Vercel).

> 📘 **Para fazer o deploy, leia [`DOCUMENTACAO_DEPLOY_FINAL.md`](DOCUMENTACAO_DEPLOY_FINAL.md).**
> Esse README cobre apenas execução local.

---

## Estrutura

```
.
├── index.html                              # Landing principal (R$ 197)
├── diagnostico-gestao-veterinaria.html     # Formulário de 8 seções
├── obrigado.html                           # Pós-pagamento
├── api/                                    # Funções serverless (Vercel)
│   ├── checkout.js
│   ├── diagnostico.js
│   ├── webhook.js
│   └── payment-status/[id].js
├── lib/
│   ├── asaas.js                            # Cliente Asaas
│   └── crm.js                              # Camada futura de CRM
├── assets/                                 # Imagens
├── server.js                               # Express APENAS para dev local
├── vercel.json
└── .env.example
```

---

## Rodar localmente

Pré-requisitos: **Node.js 18.17+**.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis
cp .env.example .env
# edite .env e preencha ASAAS_API_KEY, ASAAS_ENVIRONMENT, etc.

# 3. Subir o servidor
npm run dev
```

Acesse `http://localhost:3000`.

> O `server.js` é um adapter Express que monta as funções de `api/` na mesma origem da página, para reproduzir o comportamento da Vercel localmente. **Ele não é usado em produção.**

---

## Variáveis de ambiente

Veja [`.env.example`](.env.example) para a lista completa e instruções.

Resumo:
- `ASAAS_API_KEY` — chave de API (obrigatória)
- `ASAAS_ENVIRONMENT` — `production` ou `sandbox` (padrão: `production`)
- `ASAAS_WEBHOOK_TOKEN` — token de validação do webhook
- `CRM_ENABLED`, `CRM_API_URL`, `CRM_API_KEY` — integração futura

Nunca commite o `.env`. Ele está no `.gitignore`.

---

## Deploy

Deploy em **Vercel**, leia: [`DOCUMENTACAO_DEPLOY_FINAL.md`](DOCUMENTACAO_DEPLOY_FINAL.md).
