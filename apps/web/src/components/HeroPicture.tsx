import pasture768 from '../assets/pasto-768.webp';
import pasture1280 from '../assets/pasto-1280.webp';
import pasture1920 from '../assets/pasto-1920.webp';
import pastureFallback from '../assets/pasto-1280.jpg';
import corral320 from '../assets/curral-320.webp';
import corral480 from '../assets/curral-480.webp';
import corral768 from '../assets/curral-768.webp';
import corral320Jpeg from '../assets/curral-320.jpg';
import corral480Jpeg from '../assets/curral-480.jpg';
import corral768Jpeg from '../assets/curral-768.jpg';
import pasture768Jpeg from '../assets/pasto-768.jpg';
import pasture1280Jpeg from '../assets/pasto-1280.jpg';
import pasture1920Jpeg from '../assets/pasto-1920.jpg';

export default function HeroPicture() {
  return (
    <picture className="hero__image">
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet={`${corral320} 320w, ${corral480} 480w, ${corral768} 768w`}
        sizes="(max-width: 680px) calc(100vw - 1.1rem), calc(100vw - 2rem)"
      />
      <source
        media="(max-width: 767px)"
        type="image/jpeg"
        srcSet={`${corral320Jpeg} 320w, ${corral480Jpeg} 480w, ${corral768Jpeg} 768w`}
        sizes="(max-width: 680px) calc(100vw - 1.1rem), calc(100vw - 2rem)"
      />
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={`${pasture768} 768w, ${pasture1280} 1280w, ${pasture1920} 1920w`}
        sizes="min(calc(100vw - 2rem), 1248px)"
      />
      <source
        media="(min-width: 768px)"
        type="image/jpeg"
        srcSet={`${pasture768Jpeg} 768w, ${pasture1280Jpeg} 1280w, ${pasture1920Jpeg} 1920w`}
        sizes="min(calc(100vw - 2rem), 1248px)"
      />
      <img
        srcSet={`${pasture768Jpeg} 768w, ${pasture1280Jpeg} 1280w, ${pasture1920Jpeg} 1920w`}
        sizes="min(calc(100vw - 2rem), 1248px)"
        src={pastureFallback}
        width="1280"
        height="320"
        alt=""
        fetchPriority="low"
      />
    </picture>
  );
}
