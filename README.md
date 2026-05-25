# Catedral Sagrado Corazón — Sistema de Bingo Online

Sistema permanente de venda de cupons de bingo para a **Catedral Sagrado Corazón de Katueté, Paraguay**.

## Estrutura

```
/
├── apps/
│   ├── api/        Backend Express + Prisma + Socket.io
│   ├── web/        Site público (React + Vite + Tailwind)
│   └── admin/      Painel admin (React + Vite + Tailwind)
├── packages/
│   ├── types/      Tipos TypeScript compartilhados
│   └── utils/      Funções utilitárias compartilhadas
├── railway.json    Configuração Railway
└── package.json    Workspaces
```

## Setup Local

```bash
# Instalar dependências de todos os workspaces
npm install

# Configurar variáveis
cp .env.example .env
# Edite o .env com seu DATABASE_URL etc.

# Gerar Prisma client + rodar migrations
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Rodar tudo (em 3 terminais)
npm run dev:api       # http://localhost:3000
npm run dev:web       # http://localhost:5173
npm run dev:admin     # http://localhost:5174
```

## Deploy no Railway

Crie 4 serviços no Railway:

1. **PostgreSQL** (plugin) → expõe `DATABASE_URL`
2. **api** → root `apps/api`, comando build `npm install && npm run build && npm run prisma:deploy`, start `npm start`
3. **web** → root `apps/web`, build `npm install && npm run build`, serve via `npm run preview` ou static
4. **admin** → root `apps/admin`, idem ao web

Configure todas as variáveis do `.env.example` em cada serviço.

## Stack

- **Backend**: Node 20 + TypeScript + Express + Prisma + PostgreSQL + Socket.io + Zod + JWT + bcrypt
- **Email**: Resend
- **WhatsApp**: Z-API (ou Evolution API)
- **Pagamento online**: Bancard (preparado, ativação futura)
- **Frontend**: React 18 + Vite 5 + TailwindCSS 3 + i18next
- **Relatórios**: ExcelJS + PDFKit
- **Storage**: Railway Volume (`UPLOAD_DIR`)

## Funcionalidades

- Cadastro/login com JWT (access 15min + refresh 7d)
- Visualização de eventos ativos com layout premium
- Grade visual de cupons disponíveis com **status em tempo real (Socket.io)**
- Carrinho + checkout com upload de comprovante de transferência
- Aprovação manual de pagamentos pelo admin
- Webhook Bancard preparado para pagamento online
- Envio automático de PDF da cartela por email (Resend) e WhatsApp (Z-API)
- Painel admin completo: dashboard, eventos, sponsors, sorteios, pagamentos, clientes, relatórios
- Relatórios Excel e PDF filtráveis
- Internacionalização PT/ES com detecção automática

## Domínio

- **Evento** = bingo presencial com data, local, sorteios e patrocinadores
- **Cupom** = unidade de compra (2 cartões consecutivos, ex: #4657 + #4658) — Gs. 100.000
- **Cartão** = uma cartela com 1 grade de números que concorre em todos os sorteios do evento
- **Sorteio** = um dos N sorteios do evento (ex: 1º = Gs. 30M, 2º = Gs. 50M, ..., Final = Gs. 200M)
