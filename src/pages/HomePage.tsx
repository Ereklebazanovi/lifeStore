import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import BlackFridayHero from "../components/BlackFridayHero";
import Catalog from "../components/Catalog";
import CategoryGrid from "../components/CategoryGrid";
import ProductCard from "../components/ProductCard";
import SEOHead from "../components/SEOHead";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { useCategoryStore } from "../store/categoryStore";
import { useProductStore } from "../store/productStore";
import { blackFridayEnabled, blackFridayPath, getBlackFridayFeatured, getBlackFridayProducts, getBlackFridayStartingPrice } from "../utils/blackFriday";
import { storefrontPath } from "../utils/storefrontPaths";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  const { categories, fetchCategories, isLoading: categoriesLoading } = useCategoryStore();
  const activeCategories = categories.filter(category => category.isActive !== false)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const offers = blackFridayEnabled ? getBlackFridayProducts(products) : [];
  const showCampaign = blackFridayEnabled && (offers.length > 0 || products.length === 0);
  const featured = getBlackFridayFeatured(offers);
  const campaignHref = storefrontPath(blackFridayPath, i18n.language);

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
        {showCampaign ? (
          <BlackFridayHero href={campaignHref} startingPrice={getBlackFridayStartingPrice(offers)} />
        ) : (
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
        )}
        {featured.length > 0 && (
          <section className="black-friday-featured" aria-labelledby="black-friday-featured-title">
            <h2 id="black-friday-featured-title" className="store-display">{t("blackFriday.featured")}</h2>
            <div className="store-product-grid">
              {featured.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}
        <CategoryGrid categories={activeCategories} products={products} loading={categoriesLoading} />
        <section className="store-home-catalog" aria-labelledby="home-catalog">
          <h2 id="home-catalog" className="store-display" tabIndex={-1}>{t("home.allProducts")}</h2>
          <Catalog products={products} categories={activeCategories} loading={productsLoading} defaultSort="newest" />
        </section>
      </div>
    </>
  );
}
