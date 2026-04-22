//analytics.ts
let googleAnalyticsInitialized = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();

const shouldEnableGoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID) return false;
  // Avoid polluting GA during local development by default.
  return Boolean(import.meta.env.PROD);
};

const ensureGtagBootstrap = () => {
  if (window.gtag && window.dataLayer) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer?.push(args);
  };
};

export const initGoogleAnalytics = () => {
  if (googleAnalyticsInitialized) return;
  if (!shouldEnableGoogleAnalytics()) return;

  ensureGtagBootstrap();

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`
  );
  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA_MEASUREMENT_ID!
    )}`;
    document.head.appendChild(script);
  }

  window.gtag?.("js", new Date());
  // Disable automatic page_view; we send it on route changes.
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  googleAnalyticsInitialized = true;
};

export const trackPageView = (path: string) => {
  if (!shouldEnableGoogleAnalytics()) return;
  ensureGtagBootstrap();

  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_location: window.location.href,
  });
};

