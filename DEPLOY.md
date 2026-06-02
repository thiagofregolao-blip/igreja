# Deploy no Railway — serviço ÚNICO

Toda a aplicação roda em **um único serviço**: a API Express serve o site do cliente
em `/`, o painel admin em `/admin` e a própria API em `/api`. Você precisa apenas de
**1 serviço (app) + 1 Postgres**.

## 1. Postgres
Crie um projeto no Railway e adicione o plugin **PostgreSQL**. Ele exporta `DATABASE_URL` automaticamente.

## 2. App (serviço único)
- **Source**: este repositório
- **Root directory**: deixe **vazio** (o build roda a partir da raiz do monorepo)
- **Build**: detectado automaticamente pelo `nixpacks.toml` da raiz, que:
  1. instala as dependências (`npm ci --include=dev`)
  2. gera o Prisma Client (`prisma generate`)
  3. builda os 3 apps (`npm run build` → web + admin + api)
  4. no start: roda `prisma migrate deploy` e sobe a API (`npm run start:api`)
- **Variáveis** (referencie `${{Postgres.DATABASE_URL}}` para o banco):
  - `DATABASE_URL` = referência ao Postgres
  - `NODE_ENV` = `production`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` (gere com `openssl rand -base64 48`)
  - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_CEDULA`, `ADMIN_PHONE`, `ADMIN_PASSWORD`
  - `RESEND_API_KEY`, `EMAIL_FROM`
  - `WHATSAPP_PROVIDER` = `zapi` ou `evolution` (+ variáveis do provider)
  - `BANCARD_*` (deixe vazio até integrar)
  - `UPLOAD_DIR` = `/data/uploads`
  - `PORT` = o Railway define automaticamente
  - **NÃO** defina `VITE_API_URL` — assim os frontends chamam `/api` na mesma origem.
- **Volume**: monte um volume persistente em `/data` para preservar uploads (PDFs/imagens).
- Após o primeiro deploy, rode o seed via console Railway:
  ```
  npm run prisma:seed --workspace=@catedral/api
  ```

## 3. Domínio
Configure um domínio customizado pelo dashboard do Railway. Tudo responde nesse mesmo host:
`/` (cliente), `/admin` (painel) e `/api` (backend).

---

## Importou e o Railway criou 3 serviços?
Isso acontece porque o repositório é um monorepo com workspaces (`apps/api`, `apps/web`,
`apps/admin`). Para o deploy de serviço único: **apague 2 dos 3 serviços** e mantenha apenas
um, com **Root directory vazio**. Ele usará o `nixpacks.toml` da raiz e servirá tudo.

## Notas
- **Bancard**: integração comentada. Com credenciais, preencha `BANCARD_*`; o webhook em `POST /api/webhooks/bancard` ativa automaticamente.
- **WhatsApp**: requer instância na Z-API (https://z-api.io) ou Evolution self-hosted. Sem credenciais, o envio é ignorado silenciosamente (log).
- **Email**: requer domínio verificado no Resend para envios em produção.
- **Volume de uploads**: sem volume, os PDFs/imagens são perdidos a cada deploy. Sempre monte volume em produção.
