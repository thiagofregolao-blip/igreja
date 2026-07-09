import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Pagamento com cartão — Embedded Checkout da Dinelco/Bepsa.
 *
 * Fluxo:
 *  1. Backend cria a sessão (POST /payments/dinelco/session) -> { integrityToken, formUrl }.
 *  2. Um form oculto posta o token (input name="JWT") para formUrl, com target no iframe —
 *     o checkout da Dinelco carrega dentro do iframe, no nosso domínio.
 *  3. O iframe emite postMessage 'payment.success' | 'payment.failed'.
 *  4. No sucesso, o backend CONFIRMA a sessão direto na Bepsa (POST /payments/dinelco/confirm)
 *     antes de liberar o bilhete — o postMessage sozinho não vale como prova.
 */

export function DinelcoCard({
  paymentId,
  amountLabel,
  onSuccess,
}: {
  paymentId: string;
  amountLabel: string;
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'init' | 'ready' | 'confirming'>('init');
  const [slowHint, setSlowHint] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const formOriginRef = useRef<string>('');
  const confirmingRef = useRef(false);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function confirm() {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setPhase('confirming');
    setError(null);
    try {
      const { data } = await api.post('/payments/dinelco/confirm', { paymentId });
      if (data.ok) { onSuccess(); return; }
      setError('Pagamento não aprovado.');
      setPhase('ready');
    } catch (e: any) {
      if (e?.response?.status === 202) {
        // ainda processando — tenta de novo em alguns segundos
        setTimeout(() => { confirmingRef.current = false; confirm(); }, 4000);
        return;
      }
      setError(e?.response?.data?.message ?? 'Não foi possível confirmar o pagamento.');
      setPhase('ready');
    }
    confirmingRef.current = false;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/payments/dinelco/session', { paymentId });
        if (cancelled) return;
        formOriginRef.current = new URL(data.formUrl).origin;
        if (formRef.current && tokenRef.current) {
          formRef.current.action = data.formUrl;
          tokenRef.current.value = data.integrityToken;
          formRef.current.submit();
          setPhase('ready');
          // Se o iframe do checkout não "conversar" em ~18s (host fora do ar/
          // bloqueado/conexão recusada), mostra um aviso amigável.
          slowTimerRef.current = setTimeout(() => setSlowHint(true), 18000);
        }
      } catch (e: any) {
        setError(
          e?.response?.status === 503
            ? 'Pagamento com cartão ainda não está disponível (em configuração).'
            : e?.response?.data?.message ?? 'Erro ao iniciar o pagamento com cartão',
        );
      }
    })();

    const onMessage = (ev: MessageEvent) => {
      // aceita eventos apenas do domínio do checkout da Dinelco
      if (!formOriginRef.current || ev.origin !== formOriginRef.current) return;
      // O iframe respondeu → cancela o aviso de "demorando"
      if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
      setSlowHint(false);
      const status = (ev.data && (ev.data.paymentStatus ?? ev.data.status)) as string | undefined;
      if (status === 'payment.success') void confirm();
      else if (status === 'payment.failed') setError('Pagamento recusado pelo cartão. Verifique os dados e tente novamente.');
    };
    window.addEventListener('message', onMessage);
    return () => {
      cancelled = true;
      window.removeEventListener('message', onMessage);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  return (
    <div>
      <div className="bg-cream-100 rounded-2xl p-3 sm:p-4 mb-4 border border-line">
        <p className="text-muted text-xs uppercase tracking-widest font-bold mb-3 px-2 pt-1">
          Cartão de crédito / débito · Dinelco — {amountLabel}
        </p>
        {phase === 'init' && !error && (
          <p className="text-gold-700 text-sm text-center py-10 animate-pulse">Carregando pagamento seguro…</p>
        )}
        {/* O checkout da Dinelco carrega aqui dentro */}
        <iframe
          name="dinelcoCheckout"
          title="Dinelco Checkout"
          className="w-full rounded-xl bg-white"
          style={{ height: 720, border: '1px solid #e6e1d5', display: phase === 'init' && !error ? 'none' : 'block' }}
        />
        <form ref={formRef} method="POST" target="dinelcoCheckout" style={{ display: 'none' }}>
          <input ref={tokenRef} type="hidden" name="JWT" value="" readOnly />
        </form>
      </div>

      {phase === 'confirming' && (
        <p className="text-gold-700 text-sm mb-3 font-semibold text-center animate-pulse">Confirmando pagamento…</p>
      )}
      {slowHint && phase !== 'confirming' && (
        <div className="rounded-xl p-3 mb-3 text-sm text-amber-900 text-center"
             style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.4)' }}>
          O pagamento está demorando para carregar. Se aparecer um erro de conexão,
          verifique sua internet e tente novamente em instantes — sua reserva continua válida.
        </div>
      )}
      {error && <p className="text-red-600 text-sm mb-3 font-semibold text-center">{error}</p>}

      {/* Rede de segurança: se o postMessage se perder, o usuário confirma manualmente */}
      {phase !== 'init' && (
        <button onClick={() => void confirm()} disabled={phase === 'confirming'}
                className="text-xs text-muted hover:text-gold-700 mx-auto block font-semibold disabled:opacity-40">
          Já paguei — verificar pagamento
        </button>
      )}
      <p className="text-muted text-[11px] text-center mt-3">🔒 Pagamento processado com segurança pela Dinelco (Bepsa).</p>
    </div>
  );
}
