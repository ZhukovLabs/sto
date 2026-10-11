'use client';

import { useEffect, useRef, useState } from 'react';

interface YandexMapProps {
  lat: number;
  lon: number;
  zoom?: number;
  /** Заголовок точки: подсказка и содержимое балуна */
  title?: string;
}

/** Геометрия маркера — держать синхронно с public/map/marker.svg */
const MARKER_HREF = '/map/marker.svg';
const MARKER_SIZE: [number, number] = [44, 56];
const MARKER_ANCHOR: [number, number] = [-22, -54];

interface YmapsMap {
  destroy: () => void;
  geoObjects: { add: (obj: unknown) => void };
  container: { fitToViewport: () => void };
}

interface YmapsApi {
  ready: (callback: () => void) => void;
  Map: new (
    container: HTMLElement,
    state: { center: [number, number]; zoom: number; controls?: string[] },
    options?: { scrollWheelZoom?: boolean },
  ) => YmapsMap;
  Placemark: new (
    coordinates: [number, number],
    properties: { hintContent?: string; balloonContent?: string },
    options: {
      iconLayout: string;
      iconImageHref: string;
      iconImageSize: [number, number];
      iconImageOffset: [number, number];
    },
  ) => unknown;
}

declare global {
  interface Window {
    ymaps?: YmapsApi;
  }
}

let loader: Promise<YmapsApi> | null = null;

function loadYmaps(): Promise<YmapsApi> {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  loader ??= new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    const src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${apiKey}` : ''}`;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (window.ymaps) resolve(window.ymaps);
      else reject(new Error('ymaps is not available'));
    };
    script.onerror = () => {
      loader = null;
      reject(new Error('Failed to load Yandex Maps script'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export function YandexMap({ lat, lon, zoom = 14, title }: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: YmapsMap | null = null;
    let disposed = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    loadYmaps()
      .then((ymaps) => {
        if (disposed || !containerRef.current) return;
        ymaps.ready(() => {
          if (disposed || !containerRef.current) return;
          try {
            map = new ymaps.Map(
              containerRef.current,
              { center: [lat, lon], zoom, controls: ['zoomControl'] },
              { scrollWheelZoom: false },
            );
            const placemark = new ymaps.Placemark(
              [lat, lon],
              { hintContent: title, balloonContent: title },
              {
                iconLayout: 'default#image',
                iconImageHref: MARKER_HREF,
                iconImageSize: MARKER_SIZE,
                iconImageOffset: MARKER_ANCHOR,
              },
            );
            map.geoObjects.add(placemark);
          } catch (error) {
            // Квота/невалидный ключ и прочие ошибки инициализации — на фолбэк.
            console.error('YandexMap init:', error instanceof Error ? error.message : error);
            if (!disposed) setFailed(true);
          }
        });
      })
      .catch((error: unknown) => {
        if (disposed) return;
        console.error('YandexMap:', error instanceof Error ? error.message : error);
        setFailed(true);
      });

    const onResize = (): void => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!disposed) map?.container.fitToViewport();
      }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      map?.destroy();
    };
  }, [lat, lon, zoom, title]);

  if (failed) {
    return (
      <iframe
        src={`https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=${zoom}`}
        title={title ? `Карта — ${title}` : 'Карта'}
        allowFullScreen
        loading="lazy"
        className="h-full w-full border-0"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={title ? `Карта — ${title}` : 'Карта'}
      className="h-full w-full"
    />
  );
}
