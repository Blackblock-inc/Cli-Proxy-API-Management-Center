import { useEffect } from 'react';
import { INLINE_LOGO_JPEG } from '@/assets/logoInline';
import { BRAND_ABBR, BRAND_FULL_NAME_WITH_EDITION } from '@/utils/branding';
import './SplashScreen.scss';

interface SplashScreenProps {
  onFinish: () => void;
  fadeOut?: boolean;
}

const FADE_OUT_DURATION = 400;

export function SplashScreen({ onFinish, fadeOut = false }: SplashScreenProps) {
  useEffect(() => {
    if (!fadeOut) return;
    const finishTimer = setTimeout(() => {
      onFinish();
    }, FADE_OUT_DURATION);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [fadeOut, onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img src={INLINE_LOGO_JPEG} alt={BRAND_ABBR} className="splash-logo" />
        <h1 className="splash-title">{BRAND_ABBR}</h1>
        <p className="splash-subtitle">{BRAND_FULL_NAME_WITH_EDITION}</p>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
