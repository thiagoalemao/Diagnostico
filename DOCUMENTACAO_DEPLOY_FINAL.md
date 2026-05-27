# Deploy — O que ainda precisa ser feito

Alvo: **Vercel** + **GitHub**. Tudo no código já está pronto; faltam apenas as ações abaixo.

---

## 1. Informações que o dono precisa fornecer

1. **`ASAAS_API_KEY`** de produção (`app.asaas.com → Minha Conta → Integrações → API`).
2. **`ASAAS_WEBHOOK_TOKEN`** — string aleatória forte (será cadastrada na Vercel **e** no painel Asaas).
3. **Decisão sobre CRM**:
   - Se já existe: `CRM_API_URL`, `CRM_API_KEY` e formato esperado do payload.
   - Se não: manter `CRM_ENABLED=false`.
4. **Confirmação de contatos** (atualmente no código):
   - WhatsApp `+55 79 8172-6045`
   - Grupo: `https://chat.whatsapp.com/J7bb4I7my396Ckez4sEeM1`
   - E-mail `contato@thiagoalemao.com.br`
   - Instagram `@thiagoalemaovet`
   - Pixel Facebook `678415494826119`
5. **Google Analytics** — ID, se for instalar (não está hoje).
6. **Domínio final** + acesso DNS.
7. **Política de Privacidade** e **Termos de Uso** — textos ou autorização para criar páginas simples (LGPD: o formulário coleta nome, WhatsApp e dados financeiros).
8. **Conta/Team Vercel** que receberá o projeto.

---

## 2. Variáveis a cadastrar na Vercel

| Variável | Obrigatória | Valor |
|---|---|---|
| `ASAAS_API_KEY` | **Sim** | Chave de produção do Asaas |
| `ASAAS_ENVIRONMENT` | Sim | `production` |
| `ASAAS_WEBHOOK_TOKEN` | Recomendada | Mesmo valor cadastrado no painel Asaas |
| `ASAAS_BASE_URL` | Não | Deixar vazio |
| `CRM_ENABLED` | Sim | `false` (ou `true` se CRM existir) |
| `CRM_API_URL` | Condicional | Só se `CRM_ENABLED=true` |
| `CRM_API_KEY` | Condicional | Só se `CRM_ENABLED=true` |
| `CRM_AUTH_HEADER` | Não | Default `x-api-key` |
| `SITE_URL` | Não | URL pública final (uso futuro) |

Escopo: **Production** (e **Preview** se quiser testar PRs). Após cadastrar, redeploy.

---

## 3. Passos no painel Asaas

- Cadastrar webhook em **Integrações → Webhooks**:
  - URL: `https://SEU_DOMINIO/api/webhook`
  - Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`
  - Token: mesmo valor de `ASAAS_WEBHOOK_TOKEN`
- Testar com o botão "testar webhook" do painel.

---

## 4. Passos no painel Vercel

1. **Add New → Project** → importar o repositório do GitHub.
2. Framework Preset: **Other**. Build Command vazio, Output Directory vazio, Install Command `npm install`.
3. **Settings → Environment Variables**: cadastrar tudo da §2.
4. Deploy. A Vercel detecta `api/*.js` como serverless functions automaticamente.
5. Configurar **domínio final** + apontar DNS.

---

## 5. Checklist de validação pós-deploy

- [ ] `git status` confirma que `.env` **não** está versionado
- [ ] Todas as variáveis da §2 cadastradas na Vercel
- [ ] Webhook do Asaas cadastrado e testado
- [ ] Landing acessível em `https://SEU_DOMINIO/`
- [ ] Formulário acessível em `https://SEU_DOMINIO/diagnostico-gestao-veterinaria.html`
- [ ] DevTools → Network: chamadas vão para `/api/*` no domínio final (não `localhost`)
- [ ] `View Source` da landing não contém `ASAAS` nem `CRM`
- [ ] Cobrança real de teste (R$ 0,01) realizada e cancelada
- [ ] Webhook recebido com sucesso (ver Function Logs na Vercel)
- [ ] Página `obrigado.html` exibida após confirmação
- [ ] Contatos confirmados (WhatsApp, e-mail, Instagram, grupo, Pixel)
- [ ] Política de privacidade e termos publicados
- [ ] Google Analytics instalado (se aplicável)

---

## Mapa de endpoints (referência)

| Rota | Método | Função |
|---|---|---|
| `/api/checkout` | POST | Cria cobranças Pix e Cartão no Asaas |
| `/api/payment-status/:id` | GET | Polling do status do pagamento |
| `/api/webhook` | POST | Recebe eventos do Asaas (valida token) |
| `/api/diagnostico` | POST | Recebe respostas do formulário e encaminha ao CRM |
