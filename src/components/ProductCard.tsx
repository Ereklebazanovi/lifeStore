import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StorefrontPhoto from "./StorefrontPhoto";
import type { Product } from "../types";
import { getDiscountText } from "../utils/discount";
import { getLocalizedProductName } from "../utils/i18nHelpers";
import { getProductDisplayPrice, getProductOriginalDisplayPrice, getProductStock } from "../utils/productHelpers";
import { storefrontPath } from "../utils/storefrontPaths";
import { getProductPhoto } from "../utils/storefrontPhotos";

export default function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const name = getLocalizedProductName(product, i18n.language);
  const href = storefrontPath(`/product/${product.slug || product.id}`, i18n.language);
  const outOfStock = getProductStock(product) <= 0;
  const oldPrice = getProductOriginalDisplayPrice(product);
  const discount = getDiscountText(product);

  return (
    <Link to={href} className="product-card group">
      <div className="product-card-media">
        <StorefrontPhoto photo={getProductPhoto(product)} />
        {(outOfStock || discount) && (
          <span className={`product-card-status ${outOfStock ? "unavailable" : ""}`}>
            {outOfStock ? t("product.outOfStock") : discount}
          </span>
        )}
      </div>
      <div className="product-card-info">
        <h3>{name}</h3>
        <p className={oldPrice ? "product-card-price on-sale" : "product-card-price"}>
          <span>{getProductDisplayPrice(product)}</span>
          {oldPrice && <del>{oldPrice}</del>}
        </p>
      </div>
    </Link>
  );
}
