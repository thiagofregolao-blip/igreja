-- Adiciona o método de pagamento DINELCO (cartão online via Cybersource)
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'DINELCO';
