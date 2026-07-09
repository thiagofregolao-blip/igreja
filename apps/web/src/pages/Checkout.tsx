import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatGs } from '@/lib/format';
import { DinelcoCard } from '@/components/DinelcoCard';

export default function Checkout() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { eventId, sessionId, selectedCouponIds, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<any>(null);
  const [step, setStep] = useState<'review' | 'card' | 'done'>('review');
  const [ticket, setTicket] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [dinelcoEnabled, setDinelcoEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) nav('/login?redirect=/checkout');
    if (!eventId || selectedCouponIds.length === 0) { nav('/events'); return; }
    api.get(`/events/${eventId}`).then((r) => setEvent(r.data.event));
    api.get('/payments/dinelco/status').then((r) => setDinelcoEnabled(Boolean(r.data?.enabled))).catch(() => setDinelcoEnabled(false));
  }, [eventId, selectedCouponIds.length, user, nav]);

  if (!event) return <div className="text-center py-20 text-gold-700 animate-pulse">Carregando…</div>;
  const total = selectedCouponIds.length * event.couponPrice;

  async function placeOrder() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/tickets', {
        eventId,
        couponIds: selectedCouponIds,
        sessionId,
        paymentMethod: 'DINELCO',
      });
      setTicket(data.ticket);
      setPayment(data.payment);
      setStep('card');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="card-light rounded-[28px] p-8 md:p-10">
        <h1 className="font-display text-[34px] text-ink-900 tracking-tight mb-6">{t('checkout.title')}</h1>

        {step === 'review' && (
          <>
            <div className="bg-cream-100 rounded-2xl p-5 mb-6 border border-line">
              <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">Evento</p>
              <p className="font-extrabold text-lg text-ink-900">{event.name}</p>
              <p className="text-muted text-xs uppercase tracking-widest font-bold mt-3 mb-1">Quantidade</p>
              <p className="font-bold text-ink-900">{selectedCouponIds.length} cupons × {formatGs(event.couponPrice)}</p>
              <div className="border-t border-line mt-4 pt-4 flex items-center justify-between">
                <span className="text-muted font-bold">{t('coupon.total')}</span>
                <span className="font-display text-3xl text-gold-gradient">{formatGs(total)}</span>
              </div>
            </div>

            <p className="text-muted text-xs uppercase tracking-widest font-bold mb-3">{t('checkout.method')}</p>
            <div className="mb-6">
              <div className={`p-4 rounded-2xl border-2 text-left ${dinelcoEnabled ? 'border-gold-500 bg-gold-50' : 'border-line bg-cream-50 opacity-70'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-ink-900">Cartão de crédito / débito · Dinelco</p>
                    <p className="text-muted text-xs mt-1">
                      {dinelcoEnabled === null ? 'Verificando…' : dinelcoEnabled ? 'Confirmação automática na hora' : 'Pagamento em configuração — tente novamente mais tarde'}
                    </p>
                  </div>
                  <svg className="w-7 h-7 text-gold-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mb-3 font-semibold">{error}</p>}
            <button onClick={placeOrder} disabled={loading || !dinelcoEnabled} className="btn-gold w-full justify-center">
              {loading ? '...' : t('checkout.confirm')}
            </button>
          </>
        )}

        {step === 'card' && payment && (
          <>
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-6">
              <p className="text-emerald-800 font-extrabold">Bilhete #{ticket?.ticketNumber} reservado!</p>
              <p className="text-emerald-700 text-sm mt-1">Finalize o pagamento com cartão para confirmar.</p>
            </div>
            <DinelcoCard
              paymentId={payment.id}
              amountLabel={formatGs(total)}
              onSuccess={() => { clearCart(); setStep('done'); }}
            />
          </>
        )}

        {step === 'done' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                 style={{ background: 'rgba(230,184,54,.15)', border: '2px solid #e6b836' }}>
              <svg className="w-8 h-8 text-gold-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>
            </div>
            <h2 className="font-display text-3xl text-ink-900 mb-2">Pagamento aprovado!</h2>
            <p className="text-muted max-w-md mx-auto mb-6">Suas cartelas já são suas. Você vai recebê-las por email e WhatsApp, e elas ficam disponíveis em "Meus Bilhetes".</p>
            <button onClick={() => nav('/my-tickets')} className="btn-gold">Ver meus bilhetes</button>
          </div>
        )}
      </div>
    </div>
  );
}
