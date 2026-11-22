import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Catalog from "../components/Catalog";
import SEOHead from "../components/SEOHead";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { useCategoryStore } from "../store/categoryStore";
import { useProductStore } from "../store/productStore";
import { getLocalizedProductName } from "../utils/i18nHelpers";
import { storefrontPath } from "../utils/storefrontPaths";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, [fetchProducts, fetchCategories]);
  useInventoryRefresh({ enabled: true, interval: 45000 });
  const active = products.filter(product => product.isActive !== false);
  const title = t("home.allProducts");

  return (
    <>
      <SEOHead title={`${title} | Life Store`} description={t("storefront.heroCopy")}
        canonicalUrl={"https://lifestore.ge" + storefrontPath("/products", i18n.language)}
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
      <div className="store-shell store-page">
        <header className="store-page-heading"><h1 className="store-display">{title}</h1></header>
        <Catalog products={active} categories={categories.filter(category => category.isActive !== false)} loading={isLoading} />
      </div>
    </>
  );
}
