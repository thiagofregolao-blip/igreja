import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Pagamento com cartão — Dinelco (Cybersource Microform v2), embutido no checkout.
 *
 * Fluxo:
 *  1. Busca o capture context (JWT) no backend.
 *  2. Carrega a lib Flex/Microform da Cybersource e monta os campos seguros do cartão.
 *  3. No "Pagar", tokeniza o cartão (transient token) e envia ao backend p/ cobrar.
 *
 * ⚠️ SKELETON: a URL/versão exata da lib e o formato do capture context dependem do
 * produto que a Dinelco/Bepsa habilitar (Microform/Flex ou Unified Checkout). Ajustar
 * ao testar com as credenciais de sandbox.
 */

// URL da biblioteca Microform v2 (confirmar a versão com a Dinelco/Bepsa)
const FLEX_LIB = 'https://flex.cybersource.com/microform/bundle/v2.0/flex-microform.min.js';

declare global {
  interface Window { Flex?: any }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar a biblioteca de pagamento'));
    document.head.appendChild(s);
  });
}

export function DinelcoCard({
  paymentId,
  amountLabel,
  onSuccess,
}: {
  paymentId: string;
  amountLabel: string;
  onSuccess: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exp, setExp] = useState({ month: '', year: '' });
  const microformRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/payments/dinelco/capture-context');
        await loadScript(FLEX_LIB);
        if (cancelled || !window.Flex) return;

        const flex = new window.Flex(data.captureContext);
        const microform = flex.microform({
          styles: {
            input: { 'font-size': '15px', color: '#1c2230', 'font-family': 'system-ui, sans-serif' },
            '::placeholder': { color: '#9aa0b0' },
          },
        });
        microform.createField('number', { placeholder: 'Número do cartão' }).load('#dnl-card-number');
        microform.createField('securityCode', { placeholder: 'CVV' }).load('#dnl-card-cvv');
        microformRef.current = microform;
        setReady(true);
      } catch (e: any) {
        setError(
          e?.response?.status === 503
            ? 'Pagamento com cartão ainda não está disponível (em configuração).'
            : e?.message ?? 'Erro ao iniciar o pagamento com cartão',
        );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function pay() {
    setError(null);
    if (!microformRef.current) return;
    if (!exp.month || !exp.year) { setError('Informe a validade do cartão.'); return; }
    setLoading(true);
    microformRef.current.createToken(
      { expirationMonth: exp.month.padStart(2, '0'), expirationYear: exp.year },
      async (err: any, token: string) => {
        if (err) { setError('Verifique os dados do cartão.'); setLoading(false); return; }
        try {
          const { data } = await api.post('/payments/dinelco/pay', { paymentId, transientToken: token });
          if (data.ok) onSuccess();
          else setError('Pagamento não aprovado.');
        } catch (e: any) {
          setError(e?.response?.data?.message ?? 'Pagamento recusado pelo cartão.');
        } finally {
          setLoading(false);
        }
      },
    );
  }

  return (
    <div>
      <div className="bg-cream-100 rounded-2xl p-5 mb-5 border border-line">
        <p className="text-muted text-xs uppercase tracking-widest font-bold mb-3">Cartão de crédito / débito · Dinelco</p>

        <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-[.18em] font-bold">Número do cartão</label>
        <div id="dnl-card-number" className="input-cream h-[46px] mb-3" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-[.18em] font-bold">Validade</label>
            <div className="flex gap-2">
              <input inputMode="numeric" maxLength={2} placeholder="MM" value={exp.month}
                onChange={(e) => setExp({ ...exp, month: e.target.value.replace(/\D/g, '') })} className="input-cream w-1/2" />
              <input inputMode="numeric" maxLength={4} placeholder="AAAA" value={exp.year}
                onChange={(e) => setExp({ ...exp, year: e.target.value.replace(/\D/g, '') })} className="input-cream w-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-[.18em] font-bold">CVV</label>
            <div id="dnl-card-cvv" className="input-cream h-[46px]" />
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3 font-semibold">{error}</p>}
      <button onClick={pay} disabled={!ready || loading} className="btn-gold w-full justify-center">
        {loading ? 'Processando…' : `Pagar ${amountLabel}`}
      </button>
      <p className="text-muted text-[11px] text-center mt-3">🔒 Pagamento processado com segurança pela Dinelco.</p>
    </div>
  );
}
