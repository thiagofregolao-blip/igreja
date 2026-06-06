import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  title?: string | null;
  linkUrl?: string | null;
}

// Fallback: se não houver banners cadastrados, mostra a arte da festa.
const FALLBACK: Banner[] = [{ id: 'fallback', imageUrl: '/festa-banner.jpg', title: 'Fiesta de la Costilla' }];

export function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>(FALLBACK);
  const [idx, setIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 860);
  const [aspectMap, setAspectMap] = useState<Record<string, number>>({}); // id -> largura/altura da imagem exibida
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    api
      .get('/banners')
      .then((r) => {
        const list: Banner[] = r.data?.banners ?? [];
        if (list.length) setBanners(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const go = (n: number) => setIdx((n + count) % count);

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }

  // O container assume a proporção REAL da imagem exibida (medida ao carregar):
  // preenche a largura inteira, sem corte e sem bordas laterais.
  const active = banners[idx];
  const activeUsesMobile = isMobile && Boolean(active?.mobileImageUrl);
  const activeAspect = active ? aspectMap[active.id] : undefined;
  const sectionStyle: React.CSSProperties = activeAspect
    ? { aspectRatio: String(activeAspect) }
    : { aspectRatio: activeUsesMobile ? '4 / 5' : '1920 / 819' };

  return (
    <section
      className="relative w-full overflow-hidden bg-white select-none"
      style={sectionStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {banners.map((b, i) => {
        const useMobile = isMobile && Boolean(b.mobileImageUrl);
        const src = useMobile ? (b.mobileImageUrl as string) : b.imageUrl;
        const img = (
          <img
            src={src}
            alt={b.title ?? 'Banner'}
            onLoad={(e) => {
              const im = e.currentTarget;
              if (im.naturalWidth && im.naturalHeight) {
                const ar = im.naturalWidth / im.naturalHeight;
                setAspectMap((prev) => (prev[b.id] === ar ? prev : { ...prev, [b.id]: ar }));
              }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0 }}
            draggable={false}
          />
        );
        return b.linkUrl ? (
          <a key={b.id} href={b.linkUrl} target="_blank" rel="noreferrer" style={{ opacity: i === idx ? 1 : 0 }} className="absolute inset-0 transition-opacity duration-700">
            {img}
          </a>
        ) : (
          <div key={b.id}>{img}</div>
        );
      })}

      {count > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={() => go(idx - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white transition hover:scale-110"
            style={{ background: 'rgba(12,15,22,.5)', backdropFilter: 'blur(4px)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            aria-label="Próximo"
            onClick={() => go(idx + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white transition hover:scale-110"
            style={{ background: 'rgba(12,15,22,.5)', backdropFilter: 'blur(4px)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" /></svg>
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`Banner ${i + 1}`}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 22 : 8,
                  height: 8,
                  background: i === idx ? '#e6b836' : 'rgba(255,255,255,.7)',
                  boxShadow: '0 1px 4px rgba(0,0,0,.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
