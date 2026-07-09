import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Página exibida quando as vendas estão desativadas (SALES_ENABLED = false).
export default function SalesClosed() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-gold-700"
           style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.3)' }}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg>
      </div>
      <h1 className="font-display text-[34px] text-ink-900 tracking-tight mb-2">
        {isEs ? 'Ventas próximamente' : 'Vendas em breve'}
      </h1>
      <p className="text-muted max-w-md mb-7 leading-relaxed">
        {isEs
          ? 'La venta de cartones aún no está abierta. Estamos por habilitarla — volvé pronto para participar del bingo.'
          : 'A venda das cartelas ainda não está aberta. Estamos finalizando os últimos detalhes — volte em breve para participar do bingo!'}
      </p>
      <Link to="/" className="btn-gold">{isEs ? 'Volver al inicio' : 'Voltar ao início'}</Link>
    </div>
  );
}
