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

// --- ელ-კომერციის მოვლენები Meta-სთვის (Ads Manager-ში გაყიდვების/ROAS-ის სანახავად) ---
// content id = productCode (ან ID) — იგივე, რაც Google Merchant feed-ის g:id-ში.
const contentId = (productId: string, product?: { productCode?: string }) =>
  product?.productCode || productId;

export const trackAddToCart = (item: {
  productId: string;
  product?: { productCode?: string; name?: string };
  unitPrice: number;
  quantity: number;
}): void =>
  trackPixelEvent("AddToCart", {
    content_ids: [contentId(item.productId, item.product)],
    content_name: item.product?.name,
    content_type: "product",
    value: Math.round(item.unitPrice * item.quantity * 100) / 100,
    currency: "GEL",
  });

export const trackInitiateCheckout = (data: {
  ids: string[];
  numItems: number;
  value: number;
}): void =>
  trackPixelEvent("InitiateCheckout", {
    content_ids: data.ids,
    content_type: "product",
    num_items: data.numItems,
    value: Math.round(data.value * 100) / 100,
    currency: "GEL",
  });

// შესყიდვა იგზავნება ერთხელ თითო შეკვეთაზე (გვერდის განახლებაზე არ მეორდება);
// eventID = შეკვეთის ნომერი, რომ Meta-მ დუბლიკატი ამოიცნოს.
export const trackPurchase = (order: {
  orderNumber: string;
  totalAmount: number;
  items: { productId: string; quantity: number; price: number; product?: { productCode?: string } }[];
}): void => {
  if (!shouldEnablePixel() || !window.fbq) return;
  const key = `pixel_purchase_${order.orderNumber}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // localStorage მიუწვდომელია — მაინც ვაგზავნით, Meta eventID-ით გაფილტრავს
  }
  window.fbq(
    "track",
    "Purchase",
    {
      value: Math.round(order.totalAmount * 100) / 100,
      currency: "GEL",
      content_type: "product",
      content_ids: order.items.map((item) => contentId(item.productId, item.product)),
      contents: order.items.map((item) => ({
        id: contentId(item.productId, item.product),
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    { eventID: order.orderNumber },
  );
};
