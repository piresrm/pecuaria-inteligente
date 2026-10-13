import { Component, lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const Picture = lazy(() => import('./HeroPicture'));

class PictureFailure extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Hero({ pricesAvailable }: { pricesAvailable: boolean }) {
  const [showPicture, setShowPicture] = useState(false);
  useEffect(() => {
    if (!pricesAvailable || showPicture) return;
    const frame = requestAnimationFrame(() => setShowPicture(true));
    return () => cancelAnimationFrame(frame);
  }, [pricesAvailable, showPicture]);
  return (
    <header className="hero">
      {showPicture && (
        <PictureFailure>
          <Suspense fallback={null}>
            <Picture />
          </Suspense>
        </PictureFailure>
      )}
      <div className="hero__shade" />
      <div className="hero__copy">
        <p className="eyebrow">Mercado de reposição · Goiás</p>
        <h1>Pecuária Inteligente</h1>
        <p className="hero__summary">
          Referências demonstrativas para comparar categorias, regiões e semanas.
        </p>
        <p className="notice">Dados demonstrativos</p>
      </div>
    </header>
  );
}
