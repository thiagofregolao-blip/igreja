import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { subscribeToEvent } from '@/lib/socket';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatGs, formatLongDateES, formatLongDatePT, millionsLabel } from '@/lib/format';

interface CouponPublic {
  id: string;
  couponNumber: number;
  status: 'AVAILABLE' | 'RESERVED' | 'PENDING' | 'SOLD';
  cardNumbers: number[];
  reservedBy?: string | null;
}

interface CouponPreview {
  id: string;
  couponNumber: number;
  cards: Array<{
    id: string;
    cardNumber: number;
    imageUrl: string | null;
    drawNumbers: Array<{ drawOrder: number; prizeName: string; prizeValue: number; numbers: number[] }>;
  }>;
}

interface EventDetailData {
  id: string;
  name: string;
  nameEs: string;
  description?: string | null;
  descriptionEs?: string | null;
  location: string;
  eventDate: string;
  startTime: string;
  maxCoupons: number;
  couponPrice: number;
  cardsPerCoupon: number;
  drawCount: number;
  mainPrizeValue: number;
  totalPrizeValue: number;
  heroImageUrl?: string | null;
  sponsors: Array<{ id: string; name: string; logoUrl: string; websiteUrl?: string | null }>;
  draws: Array<{ id: string; order: number; prizeName: string; prizeNameEs: string; prizeValue: number }>;
  soldCount: number;
  availableCount: number;
}

const PLACEHOLDER_BINGO_IMAGE = '/bingo-front.jpg';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { sessionId, selectedCouponIds, setEvent, toggleCoupon, clearCart } = useCartStore();

  const [event, setEvt] = useState<EventDetailData | null>(null);
  const [coupons, setCoupons] = useState<CouponPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CouponPreview | null>(null);

  useEffect(() => {
    if (!id) return;
    setEvent(id);
    let mounted = true;
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/coupons/events/${id}/coupons`),
    ]).then(([ev, cp]) => {
      if (!mounted) return;
      setEvt(ev.data.event);
      setCoupons(cp.data.coupons);
      setLoading(false);
    });
    const unsub = subscribeToEvent(id, (payload: { couponId: string; status: any; reservedBy?: string }) => {
      setCoupons((cur) =>
        cur.map((c) =>
          c.id === payload.couponId
            ? { ...c, status: payload.status, reservedBy: payload.reservedBy ?? null }
            : c,
        ),
      );
    });
    return () => { mounted = false; unsub(); };
  }, [id, setEvent]);

  useEffect(() => {
    if (!previewId) { setPreview(null); return; }
    api.get(`/coupons/coupons/${previewId}/preview`).then((r) => setPreview(r.data.coupon)).catch(() => setPreview(null));
  }, [previewId]);

  const totalAmount = useMemo(
    () => (event ? selectedCouponIds.length * event.couponPrice : 0),
    [selectedCouponIds.length, event],
  );

  function isCouponMine(c: CouponPublic): boolean {
    return selectedCouponIds.includes(c.id) || (c.status === 'RESERVED' && c.reservedBy === sessionId);
  }

  async function handleToggle(coupon: CouponPublic) {
    if (!event) return;
    if (coupon.status === 'SOLD' || coupon.status === 'PENDING') return;
    if (coupon.status === 'RESERVED' && coupon.reservedBy && coupon.reservedBy !== sessionId) return;

    const mine = isCouponMine(coupon);
    try {
      if (mine) {
        await api.post(`/coupons/events/${event.id}/coupons/release`, { couponId: coupon.id, sessionId });
        if (selectedCouponIds.includes(coupon.id)) toggleCoupon(coupon.id);
        if (previewId === coupon.id) setPreviewId(null);
      } else {
        await api.post(`/coupons/events/${event.id}/coupons/reserve`, { couponId: coupon.id, sessionId });
        if (!selectedCouponIds.includes(coupon.id)) toggleCoupon(coupon.id);
        setPreviewId(coupon.id);
      }
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erro ao reservar');
    }
  }

  async function handleCheckout() {
    if (!event || selectedCouponIds.length === 0) return;
    if (!user) {
      nav('/login?redirect=/checkout');
      return;
    }
    nav('/checkout');
  }

  if (loading || !event) return <div className="text-center py-20 text-gold-700 animate-pulse">Carregando…</div>;

  const fmt = isEs ? formatLongDateES(event.eventDate) : formatLongDatePT(event.eventDate);
  const name = isEs ? event.nameEs : event.name;
  const totalSelected = selectedCouponIds.length;

  return (
    <div className="max-w-[1480px] mx-auto px-6 md:px-9 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-7">
        {/* COLUNA ESQUERDA */}
        <div>
          {/* HEADER DO EVENTO */}
          <div className="card-light rounded-[24px] p-7 mb-6 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[110px_1fr_auto] gap-6 items-center">
              <div className="text-center rounded-[18px] p-3"
                   style={{ background: 'linear-gradient(180deg,#171a23 0%, #0d0f15 100%)' }}>
                <p className="font-display text-4xl text-white leading-none">{fmt.day}</p>
                <p className="text-gold-500 text-[10px] tracking-[.24em] font-extrabold mt-1">{fmt.month}</p>
                <p className="text-white/55 text-[10px] mt-0.5 tracking-widest">{fmt.year}</p>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[34px] text-ink-900 leading-tight tracking-tight">{name}</h1>
                <p className="text-muted text-sm mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gold-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {event.location} • <span className="text-gold-700 font-bold">{fmt.time}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted text-[10px] tracking-[.3em] font-bold">PRÊMIO PRINCIPAL</p>
                <p className="font-display text-[40px] text-gold-gradient leading-none mt-1">{millionsLabel(event.mainPrizeValue)} <span className="text-base text-gold-700">MI</span></p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {event.draws.sort((a, b) => a.order - b.order).map((d) => (
                <div key={d.id} className="bg-cream-100 border border-line rounded-xl px-3.5 py-2 text-xs flex items-center gap-2.5">
                  <span className="text-gold-700 font-extrabold">{d.order}º</span>
                  <span className="text-muted">{isEs ? d.prizeNameEs : d.prizeName}</span>
                  <span className="font-bold text-ink-900">{formatGs(d.prizeValue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GRADE DE CUPONS (largura completa) */}
          <div className="card-dark rounded-[24px] p-6 md:p-7 text-white">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="font-display text-2xl text-gold-500">{t('coupon.gridTitle')}</h2>
                <p className="text-white/55 text-sm mt-1">{t('coupon.gridSubtitle')}</p>
              </div>
              <Legend />
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5 mt-5 max-h-[65vh] overflow-y-auto scrollbar-thin pr-2">
              {coupons.map((c) => {
                const mine = isCouponMine(c);
                const cls = mine
                  ? 'coupon-selected'
                  : c.status === 'AVAILABLE'
                  ? 'coupon-available'
                  : c.status === 'RESERVED'
                  ? 'coupon-reserved'
                  : c.status === 'PENDING'
                  ? 'coupon-pending'
                  : 'coupon-sold';
                return (
                  <button
                    key={c.id}
                    onClick={() => handleToggle(c)}
                    onMouseEnter={() => { setPreviewId(c.id); }}
                    title={`Cupom #${c.couponNumber}${c.cardNumbers.length ? ` • Cartões: ${c.cardNumbers.join(' · ')}` : ''}`}
                    className={`coupon-cell ${cls}`}
                  >
                    <span className="text-[9px] opacity-70 font-normal">#</span>
                    <span className="text-base leading-none">{c.couponNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPONSORS DO EVENTO (se admin cadastrou) */}
          {event.sponsors.length > 0 && (
            <div className="card-light rounded-[24px] p-6 mt-6">
              <h3 className="text-gold-700 font-extrabold mb-4 tracking-[.22em] text-sm">PATROCINADORES DO EVENTO</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {event.sponsors.map((s) => (
                  <a key={s.id} href={s.websiteUrl ?? '#'} target="_blank" rel="noreferrer" className="bg-white rounded-xl p-2 flex items-center justify-center magnetic h-16 border border-line">
                    <img src={s.logoUrl} alt={s.name} className="max-h-full max-w-full object-contain" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA — Carrinho FIXO em cima + Preview embaixo */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-4">
          {/* CARRINHO — altura limitada com scroll interno */}
          <div className="card-dark rounded-[24px] p-6 text-white"
               style={{ border: '1px solid rgba(230,184,54,.3)' }}>
            <h3 className="font-display text-2xl text-gold-500 mb-1">Seu carrinho</h3>
            <p className="text-white/55 text-xs mb-4">
              {totalSelected === 0
                ? 'Nenhum cupom selecionado'
                : t(totalSelected === 1 ? 'coupon.totalSelected' : 'coupon.totalSelectedPlural', { count: totalSelected })}
            </p>

            {selectedCouponIds.length > 0 && (
              <div className="overflow-y-auto scrollbar-thin space-y-1.5 mb-4 pr-1"
                   style={{ maxHeight: 130 }}>
                {selectedCouponIds.map((cid) => {
                  const cp = coupons.find((c) => c.id === cid);
                  if (!cp) return null;
                  return (
                    <div key={cid} className="flex items-center justify-between bg-ink-800 rounded-lg px-3 py-2 text-sm border border-white/5">
                      <button onClick={() => setPreviewId(cid)} className="text-white/85 hover:text-gold-500 font-semibold">
                        Cupom #{cp.couponNumber}
                      </button>
                      <button onClick={() => handleToggle(cp)} className="text-red-400 hover:text-red-300 text-xs">remover</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-white/65 text-sm font-bold">{t('coupon.total')}</span>
              <span className="font-display text-2xl text-gold-card">{formatGs(totalAmount)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedCouponIds.length === 0}
              className="btn-gold w-full justify-center mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('coupon.finishPurchase')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>

            {selectedCouponIds.length > 0 && (
              <button
                onClick={async () => {
                  for (const cid of selectedCouponIds) {
                    const cp = coupons.find((c) => c.id === cid);
                    if (cp) await api.post(`/coupons/events/${event.id}/coupons/release`, { couponId: cid, sessionId });
                  }
                  clearCart();
                  setPreviewId(null);
                }}
                className="text-xs text-white/40 hover:text-white/70 mt-2.5 mx-auto block"
              >
                Limpar carrinho
              </button>
            )}

            <p className="text-center text-white/40 text-xs mt-3 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg>
              Reservas expiram em 15 minutos
            </p>
          </div>

          {/* PREVIEW DA CARTELA — ocupa o espaço restante */}
          <CouponPreviewPanel preview={preview} previewId={previewId} fallbackImage={PLACEHOLDER_BINGO_IMAGE} />
        </aside>
      </div>
    </div>
  );
}

function CouponPreviewPanel({
  preview, previewId, fallbackImage,
}: { preview: CouponPreview | null; previewId: string | null; fallbackImage: string }) {
  // Sem cupom focado — mostra a imagem da frente do bingo como sample
  if (!previewId) {
    return (
      <div className="card-light rounded-[24px] overflow-hidden">
        <div className="bg-ink-900 text-white px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gold-500 tracking-[.28em] font-extrabold">EXEMPLO DE CARTELA</p>
            <p className="text-xs text-white/55 mt-0.5">Passe o mouse em um cupom para ver</p>
          </div>
          <svg className="w-5 h-5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </div>
        <div className="relative">
          <img src={fallbackImage} alt="Exemplo de cartela do bingo" className="w-full block" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="card-light rounded-[24px] p-6 text-center min-h-[200px] flex items-center justify-center">
        <p className="text-gold-700 animate-pulse">Carregando cartela…</p>
      </div>
    );
  }

  // Cupom existe mas não tem cartelas cadastradas pelo admin → mostra imagem do bingo como referência
  if (preview.cards.length === 0) {
    return (
      <div className="card-light rounded-[24px] overflow-hidden">
        <div className="bg-ink-900 text-white px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gold-500 tracking-[.28em] font-extrabold">CUPOM</p>
            <p className="font-display text-xl text-white">#{preview.couponNumber}</p>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-extrabold tracking-widest">
            EXEMPLO
          </span>
        </div>
        <div className="relative">
          <img src={fallbackImage} alt="Exemplo de cartela do bingo" className="w-full block" />
        </div>
        <p className="text-center text-muted text-xs py-3 px-4 leading-relaxed">
          <span className="text-gold-700 font-bold">Modelo da cartela física.</span><br/>
          A sua será entregue no dia do evento ou enviada após pagamento confirmado.
        </p>
      </div>
    );
  }

  return (
    <div className="card-light rounded-[24px] overflow-hidden">
      <div className="bg-ink-900 text-white px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gold-500 tracking-[.28em] font-extrabold">CUPOM</p>
          <p className="font-display text-xl text-white">#{preview.couponNumber}</p>
        </div>
        <span className="text-[10px] bg-gold-100 text-gold-800 px-2.5 py-1 rounded-full font-extrabold tracking-widest">
          {preview.cards.length} CARTÕES
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
        {preview.cards.map((card) => (
          <div key={card.id} className="border-b border-line last:border-b-0">
            <div className="px-4 py-2 bg-cream-100 flex items-center justify-between">
              <span className="font-display text-sm text-ink-900">Cartão Nº {card.cardNumber}</span>
            </div>
            {/* Sempre mostra imagem: a do card se existir, senão a referência geral */}
            <img
              src={card.imageUrl || fallbackImage}
              alt={`Cartela ${card.cardNumber}`}
              className="w-full object-cover max-h-60 block"
            />
            {card.drawNumbers.length > 0 && (
              <div className="p-3 space-y-2 bg-white">
                {card.drawNumbers.map((dn) => (
                  <div key={dn.drawOrder}>
                    <div className="flex items-center justify-between text-[10px] tracking-widest font-extrabold mb-1">
                      <span className="text-gold-700">{dn.drawOrder}º SORTEIO</span>
                      <span className="text-muted">{formatGs(dn.prizeValue)}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[11px] text-ink-900">
                      {dn.numbers.map((n) => (
                        <div key={n} className="bg-cream-50 border border-line rounded text-center py-1 font-bold">{n}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 flex-wrap text-[11px]">
      <LegendItem cls="coupon-available" label={t('coupon.available')} />
      <LegendItem cls="coupon-selected" label={t('coupon.selected')} />
      <LegendItem cls="coupon-reserved" label={t('coupon.reserved')} />
      <LegendItem cls="coupon-sold" label={t('coupon.sold')} />
    </div>
  );
}

function LegendItem({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`coupon-cell ${cls} !aspect-auto !w-4 !h-4 !rounded`} />
      <span className="text-white/60">{label}</span>
    </div>
  );
}
