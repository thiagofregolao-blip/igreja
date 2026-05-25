# Deploy no Railway — passo a passo

## 1. Postgres
Crie um novo projeto Railway e adicione o plugin **PostgreSQL**. Ele exporta automaticamente `DATABASE_URL`.

## 2. API
- **Source**: este repositório
- **Root directory**: deixe vazio (monorepo)
- **Watch paths**: `apps/api/**`, `packages/**`, `prisma/**`
- **Config**: usa `apps/api/nixpacks.toml`
- **Variáveis** (referencie `${{Postgres.DATABASE_URL}}` para o banco):
  - `DATABASE_URL` = referência ao Postgres
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` (strings random fortes — gere com `openssl rand -base64 48`)
  - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_CEDULA`, `ADMIN_PHONE`, `ADMIN_PASSWORD`
  - `RESEND_API_KEY`, `EMAIL_FROM`
  - `WHATSAPP_PROVIDER` = `zapi` ou `evolution`
  - Variáveis do provider escolhido (`ZAPI_*` ou `EVOLUTION_*`)
  - `BANCARD_*` (deixe vazio até integrar)
  - `UPLOAD_DIR` = `/data/uploads`
  - `FRONTEND_URL` = URL pública do web
  - `ADMIN_URL` = URL pública do admin
  - `PORT` = Railway define automaticamente
- **Volume**: monte um volume persistente em `/data` para preservar uploads
- Após o primeiro deploy, rode o seed via console Railway:
  ```
  npm run prisma:seed --workspace=@catedral/api
  ```

## 3. Web (cliente)
- Source: mesmo repo
- Config: `apps/web/nixpacks.toml`
- Variáveis:
  - `VITE_API_URL` = URL pública da API + `/api` (ex: `https://api-xxx.railway.app/api`)

## 4. Admin
- Source: mesmo repo
- Config: `apps/admin/nixpacks.toml`
- Variáveis:
  - `VITE_API_URL` = igual ao web

## 5. CORS
Atualize `FRONTEND_URL` e `ADMIN_URL` no serviço da API com as URLs definitivas após o primeiro deploy.

## 6. Domínios
Configure domínios customizados pelo dashboard Railway (gratuito).

---

## Notas

- **Bancard**: integração comentada. Quando tiver credenciais, preencha `BANCARD_*` e o webhook em `POST /api/webhooks/bancard` ativa automaticamente.
- **WhatsApp**: requer instância configurada na Z-API (https://z-api.io) ou Evolution self-hosted. Sem credenciais, o envio é silenciosamente ignorado (log).
- **Email**: requer domínio verificado no Resend para envios em produção.
- **Volume de uploads**: sem volume, os PDFs/imagens são perdidos a cada deploy. Sempre monte volume em produção.
