import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import BlackFridayHero from "../components/BlackFridayHero";
import Catalog from "../components/Catalog";
import SEOHead from "../components/SEOHead";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { useCategoryStore } from "../store/categoryStore";
import { useProductStore } from "../store/productStore";
import { blackFridayEnabled, blackFridayPath, getBlackFridayProducts, getBlackFridayStartingPrice } from "../utils/blackFriday";
import { getLocalizedProductName } from "../utils/i18nHelpers";
import { storefrontPath } from "../utils/storefrontPaths";

export default function ProductsPage({ campaign = false }: { campaign?: boolean }) {
  const { t, i18n } = useTranslation();
  const isCampaign = blackFridayEnabled && campaign;
  const { products, fetchProducts, isLoading } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, [fetchProducts, fetchCategories]);
  useInventoryRefresh({ enabled: true, interval: 45000 });
  const active = isCampaign ? getBlackFridayProducts(products) : products.filter(product => product.isActive !== false);
  const title = t(isCampaign ? "blackFriday.title" : "home.allProducts");
  const catalogPath = storefrontPath("/products", i18n.language);
  const catalogCategories = categories.filter(category => category.isActive !== false && (
    !isCampaign || active.some(product => product.category === category.name)
  ));

  return (
    <>
      <SEOHead title={`${title} | Life Store`} description={t("storefront.heroCopy")}
        canonicalUrl={"https://lifestore.ge" + (isCampaign ? storefrontPath(blackFridayPath, i18n.language) : catalogPath)}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: active.length,
            itemListElement: active.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: getLocalizedProductName(product, i18n.language),
              url: "https://lifestore.ge" + storefrontPath(`/product/${product.slug || product.id}`, i18n.language),
            })),
          },
        }} />
      <div className={`store-shell store-page${isCampaign ? " black-friday-page" : ""}`}>
        {isCampaign ? <BlackFridayHero startingPrice={getBlackFridayStartingPrice(active)} /> : (
          <header className="store-page-heading"><h1 className="store-display">{title}</h1></header>
        )}
        {isCampaign && !isLoading && active.length === 0 ? (
          <div className="store-empty">
            <p>{t("blackFriday.unavailable")}</p>
            <Link to={catalogPath} className="store-button">{t("home.allProducts")}</Link>
          </div>
        ) : <Catalog products={active} categories={catalogCategories} loading={isLoading} />}
      </div>
    </>
  );
}
