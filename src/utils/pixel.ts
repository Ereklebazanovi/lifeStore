// src/utils/pixel.ts
let facebookPixelInitialized = false;

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

const PIXEL_ID = (
  import.meta.env.VITE_FACEBOOK_PIXEL_ID as string | undefined
)?.trim();

const shouldEnablePixel = (): boolean => {
  if (!PIXEL_ID) return false;
  return Boolean(import.meta.env.PROD);
};

export const initFacebookPixel = (): void => {
  if (facebookPixelInitialized) return;
  if (!shouldEnablePixel()) return;

  // Facebook Pixel standard base code
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq?.("init", PIXEL_ID);
  // პირველი PageView init-ის დროს იგზავნება;
  // route-ების შემდეგ trackPixelEvent-ი გამოიძახება.
  window.fbq?.("track", "PageView");

  facebookPixelInitialized = true;
};

export const trackPixelEvent = (
  eventName: string,
  options?: Record<string, unknown>
): void => {
  if (!shouldEnablePixel()) return;
  if (!window.fbq) return;
  window.fbq("track", eventName, options);
};
