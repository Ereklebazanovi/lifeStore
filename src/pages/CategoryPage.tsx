import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Catalog from "../components/Catalog";
import SEOHead from "../components/SEOHead";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { useCategoryStore } from "../store/categoryStore";
import { useProductStore } from "../store/productStore";
import { getLocalizedCategoryDescription, getLocalizedCategoryName, getLocalizedCategorySeoContent } from "../utils/i18nHelpers";
import { storefrontPath } from "../utils/storefrontPaths";

export default function CategoryPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { categories, fetchCategories, isLoading: categoriesLoading } = useCategoryStore();
  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, [fetchProducts, fetchCategories]);
  useInventoryRefresh({ enabled: true, interval: 45000 });

  const active = categories.filter(item => item.isActive !== false);
  const category = active.find(item => item.slug === slug);
  const catalog = storefrontPath("/products", i18n.language);

  if (!category) {
    return (
      <div className="store-shell store-page">
        <div className="store-empty" aria-busy={categoriesLoading}>
          {categoriesLoading ? <p>{t("common.loading")}</p> : (
            <>
              <h1>{t("home.categoryNotFound")}</h1>
              <Link className="store-button" to={catalog}>{t("home.allProducts")}</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const name = getLocalizedCategoryName(category, i18n.language);
  const description = getLocalizedCategoryDescription(category, i18n.language);
  const content = getLocalizedCategorySeoContent(category, i18n.language);
  const canonicalUrl = "https://lifestore.ge" + storefrontPath(`/category/${category.slug}`, i18n.language);

  return (
    <>
      <SEOHead title={`${name} | Life Store`} description={description || name} canonicalUrl={canonicalUrl}
        structuredData={{ "@context": "https://schema.org", "@type": "CollectionPage", name, description, image: category.image, url: canonicalUrl }} />
      <div className="store-shell store-page">
        <header className="store-page-heading">
          <Link to={catalog} className="store-text-link">{t("home.allProducts")}</Link>
          <h1 className="store-display">{name}</h1>
        </header>
        <Catalog products={products} categories={active} category={category} loading={isLoading} />
        {active.length > 1 && (
          <nav className="store-related-categories" aria-label={t("storefront.categories")}>
            <h2>{t("catalog.otherCategories")}</h2>
            <div>
              {active.filter(item => item.id !== category.id).map(item => (
                <Link key={item.id} to={storefrontPath(`/category/${item.slug}`, i18n.language)}>
                  {getLocalizedCategoryName(item, i18n.language)}
                </Link>
              ))}
            </div>
          </nav>
        )}
        {(description || content) && (
          <div className="blog-content store-category-description">
            {description && <p>{description}</p>}
            {content && <div dangerouslySetInnerHTML={{ __html: content }} />}
          </div>
        )}
      </div>
    </>
  );
}
