import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Central de ajuda: Como comprar / Formas de pagamento / FAQ / Termos.
 * Conteúdo longo fica aqui (pt/es) em vez do i18n.ts para não inflar o bundle de chaves.
 */

interface HelpContent {
  title: string;
  intro: string;
  nav: { buy: string; pay: string; faq: string; terms: string };
  buy: { title: string; steps: Array<{ t: string; d: string }> };
  pay: { title: string; intro: string; methods: Array<{ t: string; d: string }>; note: string };
  faq: { title: string; items: Array<{ q: string; a: string }> };
  terms: { title: string; updated: string; sections: Array<{ t: string; d: string }> };
}

const CONTENT: Record<'pt' | 'es', HelpContent> = {
  pt: {
    title: 'Central de Ajuda',
    intro: 'Tudo o que você precisa saber para participar do bingo beneficente da Catedral Sagrado Corazón de Katueté.',
    nav: { buy: 'Como comprar', pay: 'Formas de pagamento', faq: 'Perguntas frequentes', terms: 'Termos e condições' },
    buy: {
      title: 'Como comprar',
      steps: [
        { t: 'Crie sua conta', d: 'Cadastre-se com nome completo, cédula, WhatsApp e e-mail. É por esses contatos que você recebe suas cartelas e avisos do evento.' },
        { t: 'Escolha suas cartelas', d: 'Na página do evento você vê todas as cartelas disponíveis com a numeração real impressa. Clique em um número para ver a folha completa (o par de cartelas) antes de decidir.' },
        { t: 'Selecione e reserve', d: 'Ao tocar em "Selecionar", o par fica reservado para você por 15 minutos — ninguém mais pode comprá-lo nesse período. Escolha quantos pares quiser.' },
        { t: 'Finalize a compra', d: 'Revise o carrinho na barra dourada e confirme o pedido.' },
        { t: 'Pague com cartão', d: 'Informe os dados do seu cartão de crédito ou débito na tela segura da Dinelco. A aprovação é automática, na hora.' },
        { t: 'Receba suas cartelas', d: 'Com o pagamento aprovado, seu bilhete em PDF chega por e-mail e WhatsApp, e fica sempre disponível em "Meus Bilhetes".' },
      ],
    },
    pay: {
      title: 'Formas de pagamento',
      intro: 'O pagamento é feito exclusivamente com cartão, direto no site:',
      methods: [
        { t: 'Cartão de crédito ou débito (Dinelco)', d: 'Aceitamos cartões Visa e Mastercard, processados com segurança pela rede Dinelco (Bepsa), a operadora de cartões do Paraguay. A aprovação é automática: pagou, as cartelas já são suas.' },
        { t: 'Segurança dos dados', d: 'Os dados do cartão são digitados em campos protegidos, hospedados pela própria rede de pagamento — eles nunca passam pelos nossos servidores nem ficam gravados no site.' },
      ],
      note: 'Importante: a cartela só é sua depois que o pagamento é aprovado. Se a reserva de 15 minutos expirar sem pagamento, o par volta a ficar disponível para outras pessoas.',
    },
    faq: {
      title: 'Perguntas frequentes',
      items: [
        { q: 'Preciso criar conta para comprar?', a: 'Sim. O cadastro (nome, cédula, WhatsApp e e-mail) leva menos de um minuto e é essencial: é assim que registramos as cartelas no seu nome e enviamos seu bilhete.' },
        { q: 'Posso escolher a minha cartela?', a: 'Pode — essa é a graça! Você navega pela grade com a numeração real, abre qualquer cartela para ver a folha completa com os números de todos os sorteios, e só então decide.' },
        { q: 'Por que as cartelas são vendidas em pares?', a: 'Cada cupom corresponde a uma folha impressa com 2 cartelas (ex.: 1001 e 1002), e elas são vendidas juntas. As duas valem para todos os sorteios do evento.' },
        { q: 'Quanto tempo dura a minha reserva?', a: '15 minutos. Nesse período, ninguém mais consegue comprar as cartelas que você selecionou. Se o tempo acabar antes de finalizar, elas voltam a ficar disponíveis.' },
        { q: 'Quando recebo minhas cartelas?', a: 'Na hora: o pagamento com cartão é aprovado automaticamente e você recebe o bilhete em PDF por e-mail e WhatsApp. Ele também fica salvo na sua conta, na seção "Meus Bilhetes".' },
        { q: 'Como funcionam os sorteios?', a: 'No dia do evento acontecem os sorteios anunciados (em geral 5), cada um com seu prêmio. Sua cartela vale para todos os sorteios — os números de cada rodada estão impressos nela.' },
        { q: 'Preciso estar presente no evento para ganhar?', a: 'Não. As cartelas ficam registradas no seu nome. Se você ganhar, a comissão entra em contato pelo WhatsApp e e-mail cadastrados. Você também pode acompanhar tudo ao vivo pela rádio aqui do site.' },
        { q: 'Como sei se ganhei?', a: 'Os resultados são anunciados no evento e os ganhadores são contactados diretamente. Guarde seu bilhete: a conferência é feita pela numeração da cartela e pela sua cédula.' },
        { q: 'Posso cancelar a compra ou pedir reembolso?', a: 'Antes de pagar, basta deixar a reserva expirar ou remover as cartelas do carrinho. Depois que o pagamento é aprovado, a compra é definitiva — só há devolução se o evento for cancelado pela organização.' },
        { q: 'Para onde vai o dinheiro arrecadado?', a: 'Toda a renda é destinada às obras da Catedral Sagrado Corazón de Katueté. É um evento beneficente organizado pela comunidade paroquial.' },
      ],
    },
    terms: {
      title: 'Termos e condições',
      updated: 'Última atualização: julho de 2026',
      sections: [
        { t: '1. Organização', d: 'O bingo beneficente é organizado pela comissão da Catedral Sagrado Corazón de Katueté (Canindeyú, Paraguay). Toda a renda arrecadada com a venda de cartelas é destinada às obras da paróquia.' },
        { t: '2. Participação', d: 'Podem participar pessoas maiores de 18 anos. O cadastro deve conter dados verdadeiros e atualizados (nome, cédula, telefone e e-mail); eles são usados para registrar as cartelas, confirmar pagamentos e contatar ganhadores. Contas com dados falsos podem ser bloqueadas.' },
        { t: '3. Cartelas e compra', d: 'As cartelas são vendidas em pares (um cupom = uma folha com duas cartelas) e cada uma vale para todos os sorteios do evento. A seleção gera uma reserva de 15 minutos; a compra só se concretiza com o pagamento confirmado. Cartelas com pagamento não confirmado retornam ao estoque.' },
        { t: '4. Pagamento', d: 'O pagamento é realizado exclusivamente com cartão de crédito ou débito, processado de forma segura pela rede Dinelco (Bepsa). A confirmação é automática após a aprovação da transação. Transações recusadas pela operadora não geram compra, e as cartelas correspondentes retornam ao estoque. Os dados do cartão não são armazenados pela organização.' },
        { t: '5. Sorteios e prêmios', d: 'Os sorteios são realizados na data, horário e local divulgados na página do evento, de forma pública. Os prêmios de cada sorteio são os anunciados no site e no material do evento. A conferência dos ganhadores é feita pela numeração impressa na cartela vendida, registrada em nome do comprador.' },
        { t: '6. Entrega de cartelas e prêmios', d: 'As cartelas são entregues em formato digital (PDF) por e-mail e WhatsApp após a confirmação do pagamento, e ficam disponíveis na conta do comprador. Ganhadores serão contactados pelos dados cadastrados e devem apresentar documento de identidade (cédula) para retirar o prêmio.' },
        { t: '7. Cancelamento e reembolso', d: 'Compras confirmadas são definitivas. Em caso de cancelamento do evento pela organização, os valores pagos serão integralmente devolvidos. Reservas não pagas expiram automaticamente, sem qualquer cobrança.' },
        { t: '8. Dados pessoais', d: 'Os dados cadastrados são usados exclusivamente para a operação do bingo (registro de cartelas, confirmação de pagamento, envio de bilhetes e contato com ganhadores), em conformidade com a Lei nº 6534/2020 de Proteção de Dados Pessoais do Paraguay. Não compartilhamos seus dados com terceiros.' },
        { t: '9. Contato', d: 'Dúvidas e solicitações: fiestadelacostilla@katuete.com.py · WhatsApp 0961 123 456 · Salão Paroquial de Katueté, Canindeyú, Paraguay.' },
      ],
    },
  },
  es: {
    title: 'Centro de Ayuda',
    intro: 'Todo lo que necesitás saber para participar del bingo benéfico de la Catedral Sagrado Corazón de Katueté.',
    nav: { buy: 'Cómo comprar', pay: 'Formas de pago', faq: 'Preguntas frecuentes', terms: 'Términos y condiciones' },
    buy: {
      title: 'Cómo comprar',
      steps: [
        { t: 'Creá tu cuenta', d: 'Registrate con nombre completo, cédula, WhatsApp y correo. Por esos contactos recibís tus cartones y los avisos del evento.' },
        { t: 'Elegí tus cartones', d: 'En la página del evento ves todos los cartones disponibles con la numeración real impresa. Hacé clic en un número para ver la hoja completa (el par de cartones) antes de decidir.' },
        { t: 'Seleccioná y reservá', d: 'Al tocar "Seleccionar", el par queda reservado para vos por 15 minutos — nadie más puede comprarlo en ese período. Elegí todos los pares que quieras.' },
        { t: 'Finalizá la compra', d: 'Revisá el carrito en la barra dorada y confirmá el pedido.' },
        { t: 'Pagá con tarjeta', d: 'Ingresá los datos de tu tarjeta de crédito o débito en la pantalla segura de Dinelco. La aprobación es automática, al instante.' },
        { t: 'Recibí tus cartones', d: 'Con el pago aprobado, tu boleto en PDF llega por correo y WhatsApp, y queda siempre disponible en "Mis Boletos".' },
      ],
    },
    pay: {
      title: 'Formas de pago',
      intro: 'El pago se hace exclusivamente con tarjeta, directo en el sitio:',
      methods: [
        { t: 'Tarjeta de crédito o débito (Dinelco)', d: 'Aceptamos tarjetas Visa y Mastercard, procesadas con seguridad por la red Dinelco (Bepsa), la operadora de tarjetas del Paraguay. La aprobación es automática: pagaste, los cartones ya son tuyos.' },
        { t: 'Seguridad de los datos', d: 'Los datos de la tarjeta se ingresan en campos protegidos, alojados por la propia red de pago — nunca pasan por nuestros servidores ni quedan guardados en el sitio.' },
      ],
      note: 'Importante: el cartón es tuyo recién cuando el pago está aprobado. Si la reserva de 15 minutos vence sin pago, el par vuelve a quedar disponible para otras personas.',
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        { q: '¿Necesito crear una cuenta para comprar?', a: 'Sí. El registro (nombre, cédula, WhatsApp y correo) lleva menos de un minuto y es esencial: así registramos los cartones a tu nombre y te enviamos tu boleto.' },
        { q: '¿Puedo elegir mi cartón?', a: '¡Sí, esa es la gracia! Navegás por la grilla con la numeración real, abrís cualquier cartón para ver la hoja completa con los números de todos los sorteos, y recién ahí decidís.' },
        { q: '¿Por qué los cartones se venden de a pares?', a: 'Cada cupón corresponde a una hoja impresa con 2 cartones (ej.: 1001 y 1002), y se venden juntos. Los dos valen para todos los sorteos del evento.' },
        { q: '¿Cuánto dura mi reserva?', a: '15 minutos. En ese período nadie más puede comprar los cartones que seleccionaste. Si el tiempo se acaba antes de finalizar, vuelven a quedar disponibles.' },
        { q: '¿Cuándo recibo mis cartones?', a: 'Al instante: el pago con tarjeta se aprueba automáticamente y recibís el boleto en PDF por correo y WhatsApp. También queda guardado en tu cuenta, en la sección "Mis Boletos".' },
        { q: '¿Cómo funcionan los sorteos?', a: 'El día del evento se realizan los sorteos anunciados (en general 5), cada uno con su premio. Tu cartón vale para todos los sorteos — los números de cada ronda están impresos en él.' },
        { q: '¿Necesito estar presente en el evento para ganar?', a: 'No. Los cartones quedan registrados a tu nombre. Si ganás, la comisión te contacta por el WhatsApp y correo registrados. También podés seguir todo en vivo por la radio de este sitio.' },
        { q: '¿Cómo sé si gané?', a: 'Los resultados se anuncian en el evento y los ganadores son contactados directamente. Guardá tu boleto: la verificación se hace por la numeración del cartón y tu cédula.' },
        { q: '¿Puedo cancelar la compra o pedir reembolso?', a: 'Antes de pagar, basta con dejar vencer la reserva o quitar los cartones del carrito. Una vez aprobado el pago, la compra es definitiva — solo hay devolución si la organización cancela el evento.' },
        { q: '¿A dónde va el dinero recaudado?', a: 'Toda la recaudación se destina a las obras de la Catedral Sagrado Corazón de Katueté. Es un evento benéfico organizado por la comunidad parroquial.' },
      ],
    },
    terms: {
      title: 'Términos y condiciones',
      updated: 'Última actualización: julio de 2026',
      sections: [
        { t: '1. Organización', d: 'El bingo benéfico es organizado por la comisión de la Catedral Sagrado Corazón de Katueté (Canindeyú, Paraguay). Toda la recaudación por la venta de cartones se destina a las obras de la parroquia.' },
        { t: '2. Participación', d: 'Pueden participar personas mayores de 18 años. El registro debe contener datos verdaderos y actualizados (nombre, cédula, teléfono y correo); se usan para registrar los cartones, confirmar pagos y contactar ganadores. Las cuentas con datos falsos pueden ser bloqueadas.' },
        { t: '3. Cartones y compra', d: 'Los cartones se venden de a pares (un cupón = una hoja con dos cartones) y cada uno vale para todos los sorteos del evento. La selección genera una reserva de 15 minutos; la compra se concreta recién con el pago confirmado. Los cartones con pago no confirmado vuelven al inventario.' },
        { t: '4. Pago', d: 'El pago se realiza exclusivamente con tarjeta de crédito o débito, procesado con seguridad por la red Dinelco (Bepsa). La confirmación es automática tras la aprobación de la transacción. Las transacciones rechazadas por la operadora no generan compra, y los cartones correspondientes vuelven al inventario. Los datos de la tarjeta no son almacenados por la organización.' },
        { t: '5. Sorteos y premios', d: 'Los sorteos se realizan en la fecha, horario y lugar publicados en la página del evento, de forma pública. Los premios de cada sorteo son los anunciados en el sitio y en el material del evento. La verificación de ganadores se hace por la numeración impresa en el cartón vendido, registrado a nombre del comprador.' },
        { t: '6. Entrega de cartones y premios', d: 'Los cartones se entregan en formato digital (PDF) por correo y WhatsApp después de la confirmación del pago, y quedan disponibles en la cuenta del comprador. Los ganadores serán contactados por los datos registrados y deben presentar documento de identidad (cédula) para retirar el premio.' },
        { t: '7. Cancelación y reembolso', d: 'Las compras confirmadas son definitivas. En caso de cancelación del evento por parte de la organización, los montos pagados serán devueltos íntegramente. Las reservas no pagadas vencen automáticamente, sin ningún cargo.' },
        { t: '8. Datos personales', d: 'Los datos registrados se usan exclusivamente para la operación del bingo (registro de cartones, confirmación de pago, envío de boletos y contacto con ganadores), conforme a la Ley N° 6534/2020 de Protección de Datos Personales del Paraguay. No compartimos tus datos con terceros.' },
        { t: '9. Contacto', d: 'Consultas y solicitudes: fiestadelacostilla@katuete.com.py · WhatsApp 0961 123 456 · Salón Parroquial de Katueté, Canindeyú, Paraguay.' },
      ],
    },
  },
};

export default function Help() {
  const { i18n } = useTranslation();
  const { hash } = useLocation();
  const c = CONTENT[i18n.language?.startsWith('es') ? 'es' : 'pt'];

  // React Router não rola até a âncora sozinho
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0 }); return; }
    const el = document.getElementById(hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [hash]);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-9 py-10">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <h1 className="font-display text-[38px] text-ink-900 tracking-tight">{c.title}</h1>
        <div className="divider-gold w-32 mx-auto my-3" />
        <p className="text-muted max-w-xl mx-auto">{c.intro}</p>
      </div>

      {/* Navegação por âncoras */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {([['como-comprar', c.nav.buy], ['pagamento', c.nav.pay], ['faq', c.nav.faq], ['termos', c.nav.terms]] as const).map(([anchor, label]) => (
          <a key={anchor} href={`#${anchor}`}
             className="px-4 py-2 rounded-full border border-line bg-cream-50 text-ink-900 text-sm font-bold hover:border-gold-500 hover:bg-gold-50 transition-colors">
            {label}
          </a>
        ))}
      </div>

      {/* COMO COMPRAR */}
      <section id="como-comprar" className="scroll-mt-24 mb-10">
        <div className="card-light rounded-[24px] p-7 md:p-8">
          <h2 className="font-display text-2xl text-ink-900 mb-6">{c.buy.title}</h2>
          <ol className="space-y-5">
            {c.buy.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-lg text-ink-900"
                      style={{ background: 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 55%, #c98e17 100%)' }}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-extrabold text-ink-900">{s.t}</p>
                  <p className="text-muted text-sm mt-0.5 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FORMAS DE PAGAMENTO */}
      <section id="pagamento" className="scroll-mt-24 mb-10">
        <div className="card-light rounded-[24px] p-7 md:p-8">
          <h2 className="font-display text-2xl text-ink-900 mb-2">{c.pay.title}</h2>
          <p className="text-muted text-sm mb-5">{c.pay.intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {c.pay.methods.map((m, i) => (
              <div key={i} className="bg-cream-100 border border-line rounded-2xl p-5">
                <p className="font-extrabold text-ink-900 mb-1.5">{m.t}</p>
                <p className="text-muted text-sm leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4 text-sm leading-relaxed text-ink-900"
               style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.4)' }}>
            {c.pay.note}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 mb-10">
        <div className="card-light rounded-[24px] p-7 md:p-8">
          <h2 className="font-display text-2xl text-ink-900 mb-5">{c.faq.title}</h2>
          <div className="space-y-2.5">
            {c.faq.items.map((f, i) => (
              <details key={i} className="group bg-cream-50 border border-line rounded-2xl overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 font-bold text-ink-900 text-sm hover:bg-cream-100 transition-colors">
                  {f.q}
                  <svg className="w-4 h-4 text-gold-700 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </summary>
                <p className="px-5 pb-4 text-muted text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* TERMOS */}
      <section id="termos" className="scroll-mt-24 mb-6">
        <div className="card-light rounded-[24px] p-7 md:p-8">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
            <h2 className="font-display text-2xl text-ink-900">{c.terms.title}</h2>
            <span className="text-muted text-xs">{c.terms.updated}</span>
          </div>
          <div className="space-y-5">
            {c.terms.sections.map((s, i) => (
              <div key={i}>
                <p className="font-extrabold text-ink-900 text-sm mb-1">{s.t}</p>
                <p className="text-muted text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
