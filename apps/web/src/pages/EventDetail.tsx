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
  status: string;
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

function cardsLabel(cardNumbers: number[], couponNumber: number): string {
  return cardNumbers.length === 2 ? `${cardNumbers[0]} · ${cardNumbers[1]}` : `#${couponNumber}`;
}

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
  const [modalCouponId, setModalCouponId] = useState<string | null>(null);

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
      // O carrinho local só vale se o servidor confirmar a reserva desta sessão —
      // remove IDs antigos (reserva expirada, vendida ou de outra pessoa)
      const st = useCartStore.getState();
      const valid = (cp.data.coupons as CouponPublic[])
        .filter((c) => c.status === 'RESERVED' && c.reservedBy === st.sessionId)
        .map((c) => c.id);
      st.pruneCart(valid);
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
      // Se uma cartela do meu carrinho deixou de ser minha (expirou/tomada/vendida), tira do carrinho
      const st = useCartStore.getState();
      if (st.selectedCouponIds.includes(payload.couponId)) {
        const stillMine = payload.status === 'RESERVED' && payload.reservedBy === st.sessionId;
        const inMyCheckout = payload.status === 'PENDING'; // meu próprio checkout em andamento
        if (!stillMine && !inMyCheckout) {
          st.pruneCart(st.selectedCouponIds.filter((x) => x !== payload.couponId));
        }
      }
    });
    return () => { mounted = false; unsub(); };
  }, [id, setEvent]);

  const totalAmount = useMemo(
    () => (event ? selectedCouponIds.length * event.couponPrice : 0),
    [selectedCouponIds.length, event],
  );

  function isCouponMine(c: CouponPublic): boolean {
    return selectedCouponIds.includes(c.id) || (c.status === 'RESERVED' && c.reservedBy === sessionId);
  }

  async function selectCoupon(coupon: CouponPublic) {
    if (!event) return;
    await api.post(`/coupons/events/${event.id}/coupons/reserve`, { couponId: coupon.id, sessionId });
    if (!selectedCouponIds.includes(coupon.id)) toggleCoupon(coupon.id);
  }

  async function removeCoupon(coupon: CouponPublic) {
    if (!event) return;
    await api.post(`/coupons/events/${event.id}/coupons/release`, { couponId: coupon.id, sessionId });
    if (selectedCouponIds.includes(coupon.id)) toggleCoupon(coupon.id);
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
  const modalCoupon = modalCouponId ? coupons.find((c) => c.id === modalCouponId) ?? null : null;

  return (
    <div className={`max-w-[1480px] mx-auto px-6 md:px-9 py-8 ${totalSelected > 0 ? 'pb-32' : ''}`}>
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

      {/* GRADE DE CARTELAS — tela cheia */}
      <div className="card-dark rounded-[24px] p-6 md:p-7 text-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-2xl text-gold-500">{t('coupon.gridTitle')}</h2>
            <p className="text-white/55 text-sm mt-1">{t('coupon.gridSubtitle')}</p>
          </div>
          <Legend />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5 mt-5 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
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
                onClick={() => setModalCouponId(c.id)}
                title={`${t('coupon.cards')} ${cardsLabel(c.cardNumbers, c.couponNumber)}`}
                className={`coupon-cell ${cls}`}
              >
                {c.cardNumbers.length === 2 ? (
                  <>
                    <span className="text-[11px] leading-tight font-bold">{c.cardNumbers[0]}</span>
                    <span className="text-[11px] leading-tight font-bold opacity-80">{c.cardNumbers[1]}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] opacity-70 font-normal">#</span>
                    <span className="text-base leading-none">{c.couponNumber}</span>
                  </>
                )}
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

      {/* MODAL DE SELEÇÃO DA CARTELA */}
      {modalCoupon && (
        <CardModal
          coupon={modalCoupon}
          mine={isCouponMine(modalCoupon)}
          fallbackImage={PLACEHOLDER_BINGO_IMAGE}
          onSelect={async () => { await selectCoupon(modalCoupon); setModalCouponId(null); }}
          onRemove={async () => { await removeCoupon(modalCoupon); setModalCouponId(null); }}
          onClose={() => setModalCouponId(null)}
        />
      )}

      {/* BARRA DE CARRINHO FIXA NO RODAPÉ */}
      {totalSelected > 0 && (
        <CartBar
          coupons={coupons}
          selectedCouponIds={selectedCouponIds}
          totalAmount={totalAmount}
          onRemove={(c) => removeCoupon(c)}
          onClear={async () => {
            for (const cid of selectedCouponIds) {
              const cp = coupons.find((c) => c.id === cid);
              if (cp) await removeCoupon(cp);
            }
            clearCart();
          }}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}

/* ============================== MODAL ============================== */

function CardModal({
  coupon, mine, fallbackImage, onSelect, onRemove, onClose,
}: {
  coupon: CouponPublic;
  mine: boolean;
  fallbackImage: string;
  onSelect: () => Promise<void>;
  onRemove: () => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unavailable = !mine && coupon.status !== 'AVAILABLE';

  useEffect(() => {
    let mounted = true;
    setPreview(null);
    api.get(`/coupons/coupons/${coupon.id}/preview`)
      .then((r) => { if (mounted) setPreview(r.data.coupon); })
      .catch(() => { if (mounted) setPreview(null); });
    return () => { mounted = false; };
  }, [coupon.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao reservar');
      setBusy(false);
    }
  }

  const statusMsg = coupon.status === 'SOLD'
    ? t('coupon.soldMsg')
    : coupon.status === 'PENDING'
    ? t('coupon.pendingMsg')
    : t('coupon.reservedMsg');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(10,11,16,.78)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="card-light rounded-[24px] overflow-hidden w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl"
        style={{ border: '1px solid rgba(230,184,54,.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] text-gold-500 tracking-[.28em] font-extrabold">{t('coupon.cards').toUpperCase()}</p>
            <p className="font-display text-2xl text-white leading-tight">
              {cardsLabel(coupon.cardNumbers, coupon.couponNumber)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mine && (
              <span className="text-[10px] bg-gold-100 text-gold-800 px-2.5 py-1 rounded-full font-extrabold tracking-widest">
                {t('coupon.inCart').toUpperCase()}
              </span>
            )}
            {unavailable && (
              <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-extrabold tracking-widest">
                {t('coupon.unavailableTitle').toUpperCase()}
              </span>
            )}
            <button onClick={onClose} aria-label={t('coupon.close')} className="text-white/50 hover:text-white transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Folha inteira: as duas cartelas do par, empilhadas */}
        <div className="overflow-y-auto scrollbar-thin bg-white grow">
          {!preview ? (
            <div className="py-20 text-center text-gold-700 animate-pulse">{t('coupon.loadingCard')}</div>
          ) : (
            preview.cards.map((card) => (
              <div key={card.id} className="border-b border-line last:border-b-0">
                <div className="px-4 py-2 bg-cream-100">
                  <span className="font-display text-sm text-ink-900">Cartón Nº {card.cardNumber}</span>
                </div>
                <img
                  src={card.imageUrl || fallbackImage}
                  alt={`Cartón ${card.cardNumber}`}
                  className="w-full h-auto block"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-cream-50 border-t border-line shrink-0">
          {error && <p className="text-red-600 text-xs font-bold mb-2 text-center">{error}</p>}
          {unavailable ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted text-sm">{statusMsg}</p>
              <button onClick={onClose} className="btn-gold justify-center px-6">{t('coupon.close')}</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted text-xs hidden sm:block">{t('coupon.pairNote')}</p>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={onClose}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl border border-line text-muted font-bold text-sm hover:bg-cream-100 transition-colors disabled:opacity-40"
                >
                  {t('coupon.cancel')}
                </button>
                {mine ? (
                  <button
                    onClick={() => run(onRemove)}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    {busy ? '…' : t('coupon.remove')}
                  </button>
                ) : (
                  <button
                    onClick={() => run(onSelect)}
                    disabled={busy}
                    className="btn-gold justify-center px-7 disabled:opacity-40"
                  >
                    {busy ? '…' : t('coupon.select')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================= BARRA DO CARRINHO ========================= */

function CartBar({
  coupons, selectedCouponIds, totalAmount, onRemove, onClear, onCheckout,
}: {
  coupons: CouponPublic[];
  selectedCouponIds: string[];
  totalAmount: number;
  onRemove: (c: CouponPublic) => Promise<void>;
  onClear: () => Promise<void>;
  onCheckout: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const totalSelected = selectedCouponIds.length;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40">
      {/* Lista expandida */}
      {expanded && (
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6">
          <div className="card-dark text-white rounded-t-[20px] px-5 pt-4 pb-3 shadow-2xl"
               style={{ border: '1px solid rgba(230,184,54,.3)', borderBottom: 'none' }}>
            <div className="max-h-[38vh] overflow-y-auto scrollbar-thin space-y-1.5 pr-1">
              {selectedCouponIds.map((cid) => {
                const cp = coupons.find((c) => c.id === cid);
                if (!cp) return null;
                return (
                  <div key={cid} className="flex items-center justify-between bg-ink-800 rounded-lg px-3 py-2 text-sm border border-white/5">
                    <span className="text-white/85 font-semibold">
                      {t('coupon.cards')} {cardsLabel(cp.cardNumbers, cp.couponNumber)}
                    </span>
                    <button onClick={() => onRemove(cp)} className="text-red-400 hover:text-red-300 text-xs">
                      {t('coupon.remove').toLowerCase()}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <button onClick={onClear} className="text-xs text-white/40 hover:text-white/70">
                {t('coupon.clearCart')}
              </button>
              <p className="text-white/40 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg>
                {t('coupon.reservationHint')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barra principal — dourada para destacar do painel escuro da grade */}
      <div
        className="text-ink-900"
        style={{
          background: 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 55%, #c98e17 100%)',
          boxShadow: '0 -14px 36px -12px rgba(230,184,54,.7), inset 0 2px 0 rgba(255,255,255,.35)',
        }}
      >
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2.5 min-w-0 text-left group"
          >
            <span className="relative shrink-0">
              <svg className="w-6 h-6 text-ink-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span className="absolute -top-2 -right-2 bg-ink-900 text-gold-500 text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center">
                {totalSelected}
              </span>
            </span>
            <span className="hidden sm:block text-ink-900/75 text-sm font-bold group-hover:text-ink-900 transition-colors">
              {t(totalSelected === 1 ? 'coupon.totalSelected' : 'coupon.totalSelectedPlural', { count: totalSelected })}
            </span>
            <svg className={`w-4 h-4 text-ink-900/60 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
          </button>

          <div className="ml-auto flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="text-right">
              <p className="text-ink-900/60 text-[10px] tracking-widest font-extrabold hidden sm:block">{t('coupon.total').toUpperCase()}</p>
              <p className="font-display text-lg sm:text-2xl text-ink-900 leading-none whitespace-nowrap">{formatGs(totalAmount)}</p>
            </div>
            <button
              onClick={onCheckout}
              className="inline-flex items-center justify-center gap-2.5 font-bold tracking-widest text-gold-500 bg-ink-900 rounded-[14px] cursor-pointer transition-all whitespace-nowrap px-4 sm:px-6 py-3 hover:-translate-y-0.5 hover:bg-ink-800"
              style={{ boxShadow: '0 14px 28px -10px rgba(10,12,18,.55), inset 0 1px 0 rgba(255,255,255,.08)' }}
            >
              {t('coupon.finishPurchase')}
              <svg className="w-4 h-4 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== LEGENDA ============================== */

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
