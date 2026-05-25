import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatGs } from '@/lib/format';

export default function Checkout() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { eventId, sessionId, selectedCouponIds, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<any>(null);
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'BANCARD'>('BANK_TRANSFER');
  const [step, setStep] = useState<'review' | 'upload' | 'done'>('review');
  const [ticket, setTicket] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) nav('/login?redirect=/checkout');
    if (!eventId || selectedCouponIds.length === 0) { nav('/events'); return; }
    api.get(`/events/${eventId}`).then((r) => setEvent(r.data.event));
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
        paymentMethod: method,
      });
      setTicket(data.ticket);
      setStep('upload');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  }

  async function uploadReceipt() {
    if (!file || !ticket) return;
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      await api.post(`/tickets/${ticket.id}/payment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearCart();
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro no envio do comprovante');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <MethodCard active={method === 'BANK_TRANSFER'} onClick={() => setMethod('BANK_TRANSFER')} title={t('checkout.bankTransfer')} subtitle="Aprovação manual" />
              <MethodCard active={method === 'BANCARD'} onClick={() => setMethod('BANCARD')} title={t('checkout.bancard')} subtitle="Em breve" disabled />
            </div>

            {error && <p className="text-red-600 text-sm mb-3 font-semibold">{error}</p>}
            <button onClick={placeOrder} disabled={loading} className="btn-gold w-full justify-center">
              {loading ? '...' : t('checkout.confirm')}
            </button>
          </>
        )}

        {step === 'upload' && ticket && (
          <>
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-6">
              <p className="text-emerald-800 font-extrabold">Bilhete #{ticket.ticketNumber} criado!</p>
              <p className="text-emerald-700 text-sm mt-1">Faça a transferência para os dados abaixo e anexe o comprovante.</p>
            </div>

            <div className="bg-cream-100 rounded-2xl p-5 mb-6 text-sm space-y-1.5 border border-line">
              <p className="text-muted mb-2 font-bold uppercase tracking-widest text-xs">{t('checkout.bankInstructions')}</p>
              <p className="text-ink-900"><strong className="text-gold-700">Banco:</strong> Banco Familiar / Itaú</p>
              <p className="text-ink-900"><strong className="text-gold-700">Conta:</strong> 1234567-8</p>
              <p className="text-ink-900"><strong className="text-gold-700">Em nome de:</strong> Catedral Sagrado Corazón</p>
              <p className="text-ink-900"><strong className="text-gold-700">RUC:</strong> 80000000-0</p>
              <p className="border-t border-line pt-2 mt-2 text-ink-900"><strong className="text-gold-700">Valor:</strong> {formatGs(total)}</p>
            </div>

            <label className="block mb-4">
              <span className="block text-[11px] text-muted mb-2 uppercase tracking-[.22em] font-bold">{t('checkout.uploadReceipt')}</span>
              <div className="border-2 border-dashed border-line hover:border-gold-500 rounded-xl p-6 text-center cursor-pointer transition bg-cream-50">
                <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" id="receipt" />
                <label htmlFor="receipt" className="cursor-pointer block">
                  <svg className="w-10 h-10 mx-auto text-gold-700 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <p className="text-ink-900 text-sm font-bold">{file ? file.name : 'Clique para anexar'}</p>
                  <p className="text-muted text-xs mt-1">{t('checkout.uploadHint')}</p>
                </label>
              </div>
            </label>

            {error && <p className="text-red-600 text-sm mb-3 font-semibold">{error}</p>}
            <button onClick={uploadReceipt} disabled={!file || loading} className="btn-gold w-full justify-center">
              {loading ? '...' : 'Enviar comprovante'}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                 style={{ background: 'rgba(230,184,54,.15)', border: '2px solid #e6b836' }}>
              <svg className="w-8 h-8 text-gold-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>
            </div>
            <h2 className="font-display text-3xl text-ink-900 mb-2">Comprovante enviado!</h2>
            <p className="text-muted max-w-md mx-auto mb-6">A paróquia vai validar seu pagamento. Você receberá a cartela por email e WhatsApp assim que aprovado.</p>
            <button onClick={() => nav('/my-tickets')} className="btn-gold">Ver meus bilhetes</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MethodCard({ active, onClick, title, subtitle, disabled }: { active: boolean; onClick: () => void; title: string; subtitle: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 text-left transition magnetic ${
        active ? 'border-gold-500 bg-gold-50' : 'border-line bg-cream-50'
      } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none`}
    >
      <p className="font-extrabold text-ink-900">{title}</p>
      <p className="text-muted text-xs mt-1">{subtitle}</p>
    </button>
  );
}
