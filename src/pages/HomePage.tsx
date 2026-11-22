import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Catalog from "../components/Catalog";
import CategoryGrid from "../components/CategoryGrid";
import SEOHead from "../components/SEOHead";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { useCategoryStore } from "../store/categoryStore";
import { useProductStore } from "../store/productStore";
import { storefrontPath } from "../utils/storefrontPaths";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  const { categories, fetchCategories, isLoading: categoriesLoading } = useCategoryStore();
  const activeCategories = categories.filter(category => category.isActive !== false)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, [fetchProducts, fetchCategories]);
  useInventoryRefresh();

  return (
    <>
      <SEOHead title={t("storefront.homeTitle") + " | Life Store"}
        description={t("storefront.heroCopy")}
        canonicalUrl={"https://lifestore.ge" + storefrontPath("/", i18n.language)}
        structuredData={{
          "@context": "https://schema.org", "@type": "Organization",
          name: "Life Store", url: "https://lifestore.ge", logo: "https://lifestore.ge/logo.webp",
          sameAs: ["https://www.facebook.com/lifestore.ge", "https://www.instagram.com/lifestore.ge"],
        }} />
      <div className="store-home store-shell store-header-offset">
        <section className="store-home-hero" aria-labelledby="home-title">
          <img className="store-home-hero-image" src="/home-kitchen-banner.webp" alt=""
            width={1774} height={887} fetchPriority="high" />
          <div className="store-home-hero-copy">
            <h1 id="home-title" className="store-display">{t("storefront.homeTitle")}</h1>
            <p>{t("storefront.heroCopy")}</p>
            <a href="#home-catalog" className="store-button">
              {t("home.hero.shopNow")}<ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <CategoryGrid categories={activeCategories} products={products} loading={categoriesLoading} />
        <section className="store-home-catalog" aria-labelledby="home-catalog">
          <h2 id="home-catalog" className="store-display" tabIndex={-1}>{t("home.allProducts")}</h2>
          <Catalog products={products} categories={activeCategories} loading={productsLoading} defaultSort="newest" />
        </section>
      </div>
    </>
  );
}
