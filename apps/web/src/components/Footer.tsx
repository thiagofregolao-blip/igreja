export function Footer() {
  return (
    <footer className="relative bg-ink-900 text-white">
      {/* MAIN FOOTER COLUMNS */}
      <div className="py-12 px-6">
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-10">
          {/* ORGANIZA */}
          <div>
            <h4 className="text-[11px] tracking-[.32em] font-extrabold text-gold-500 mb-4">ORGANIZA</h4>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.3)' }}
              >
                <svg className="w-6 h-6 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 L12 22 M2 12 L22 12" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="text-sm leading-relaxed">
                <p className="font-bold text-white">Comissão Festa da Costela</p>
                <p className="text-white/65 mt-0.5">Salão Paroquial de Katueté</p>
              </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div>
            <h4 className="text-[11px] tracking-[.32em] font-extrabold text-gold-500 mb-4">CONTACTO</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                0961 123 456
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span className="break-all">fiestadelacostilla@katuete.com.py</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Katueté, Canindeyú · Paraguay
              </li>
            </ul>
          </div>

          {/* AYUDA */}
          <div>
            <h4 className="text-[11px] tracking-[.32em] font-extrabold text-gold-500 mb-4">AYUDA</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['¿Como comprar?', '/#how'],
                ['Formas de pagamento', '/#how'],
                ['Perguntas frequentes', '/#'],
                ['Termos e condições', '/#'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-white/75 hover:text-gold-500 transition flex items-center justify-between group">
                    {label}
                    <span className="text-white/30 group-hover:text-gold-500 transition">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SIGUENOS */}
          <div>
            <h4 className="text-[11px] tracking-[.32em] font-extrabold text-gold-500 mb-4">SIGA-NOS</h4>
            <div className="flex items-center gap-3">
              <SocialBtn href="https://facebook.com" label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
              </SocialBtn>
              <SocialBtn href="https://instagram.com" label="Instagram">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg>
              </SocialBtn>
              <SocialBtn href="https://wa.me/595961123456" label="WhatsApp">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.2-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.5-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 1.8.8 2.5.9 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5C8.3 21.5 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
              </SocialBtn>
            </div>
          </div>

          {/* COMPRA SEGURA badge */}
          <div className="self-start">
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(230,184,54,.25)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(230,184,54,.15)', border: '1px solid rgba(230,184,54,.35)' }}
              >
                <svg className="w-5 h-5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-white text-sm tracking-wider">COMPRA SEGURA</p>
                <p className="text-white/55 text-[10px] tracking-[.18em] uppercase mt-0.5">Seus dados protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/5 py-5 px-6">
        <div className="max-w-[1300px] mx-auto text-center text-white/45 text-xs">
          © {new Date().getFullYear()} <strong className="text-white/75">Catedral Sagrado Corazón — Festa da Costela</strong>. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-11 h-11 rounded-xl flex items-center justify-center text-gold-500 hover:text-ink-900 magnetic transition"
      style={{ background: 'rgba(230,184,54,.1)', border: '1px solid rgba(230,184,54,.3)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 100%)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(230,184,54,.1)';
      }}
    >
      {children}
    </a>
  );
}
