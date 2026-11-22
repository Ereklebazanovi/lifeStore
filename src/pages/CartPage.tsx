import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCartStore } from "../store/cartStore";
import { getShippingRates } from "../services/settingsService";
import { getVariantDisplayName } from "../utils/displayHelpers";
import { getLocalizedProductName } from "../utils/i18nHelpers";
import { DEFAULT_SHIPPING_RATES, formatShippingSummary } from "../utils/shipping";
import { storefrontPath } from "../utils/storefrontPaths";

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart, validateAndCleanCart, getItemPrice } = useCartStore();
  const [shippingRates, setShippingRates] = useState(DEFAULT_SHIPPING_RATES);
  useEffect(() => {
    let active = true;
    void getShippingRates().then(rates => { if (active) setShippingRates(rates); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    void validateAndCleanCart().catch(error => console.error("Cart validation failed:", error));
  }, [validateAndCleanCart]);
  const catalog = storefrontPath("/products", i18n.language);

  return (
    <div className="store-shell store-page">
      {items.length === 0 ? (
        <div className="store-empty">
          <ShoppingBag className="size-9 text-emerald-600" aria-hidden="true" />
          <h1>{t("cart.empty")}</h1>
          <p>{t("cart.emptySubtitle")}</p>
          <Link className="store-button" to={catalog}>{t("home.hero.shopNow")}</Link>
        </div>
      ) : (
        <>
          <header className="store-page-heading">
            <h1 className="store-display">{t("cart.title")}</h1>
            <p className="mt-2 text-stone-600">{t("checkout.itemCount", { count: totalItems })}</p>
          </header>
          <div className="store-cart-layout">
            <div className="store-cart-list">
              {items.map(item => {
                const base = getLocalizedProductName(item.product, i18n.language);
                const variant = getVariantDisplayName(item);
                const name = variant ? `${base} (${variant})` : base;
                const available = item.variantId ? item.product.variants?.find(value => value.id === item.variantId)?.stock ?? 0 : item.product.stock;
                const unit = getItemPrice(item);
                return (
                  <article className="store-cart-line" key={`${item.productId}:${item.variantId ?? ""}`}>
                    <Link className="store-cart-thumbnail" to={storefrontPath(`/product/${item.product.slug || item.productId}`, i18n.language)} aria-label={name}>
                      {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" loading="lazy" />
                        : <ShoppingBag className="size-6 text-stone-400" aria-hidden="true" />}
                    </Link>
                    <div className="store-cart-line-body">
                      <h2>{name}</h2>
                      <div className="store-cart-line-meta">
                        <div className="store-quantity" role="group" aria-label={t("cart.quantity")}>
                          <button type="button" aria-label={t("purchase.decrease")} disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}><Minus size={16} /></button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button type="button" aria-label={t("purchase.increase")} disabled={item.quantity >= available}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}><Plus size={16} /></button>
                        </div>
                        <span className="store-cart-line-price">₾{(unit * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                    <button type="button" className="store-cart-remove" aria-label={t("purchase.removeItem", { name })}
                      onClick={() => removeItem(item.productId, item.variantId)}><Trash2 size={17} /></button>
                  </article>
                );
              })}
              {items.length > 1 && <button type="button" className="store-cart-clear" onClick={clearCart}>{t("cart.clearCart")}</button>}
            </div>
            <aside className="store-cart-summary">
              <h2>{t("cart.orderDetails")}</h2>
              <p className="store-cart-subtotal"><span>{t("purchase.productsSubtotal")}</span><strong>₾{totalPrice.toFixed(2)}</strong></p>
              <p className="store-cart-delivery">{formatShippingSummary(shippingRates, i18n.language)}</p>
              <p className="store-cart-delivery">{t("purchase.deliveryAtCheckout")}</p>
              <Link className="store-button" to="/checkout">{t("cart.checkout")}</Link>
              <Link className="store-text-link" to={catalog}>{t("cart.continueShopping")}</Link>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
