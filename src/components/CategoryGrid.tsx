import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StorefrontPhoto from "./StorefrontPhoto";
import type { Category, Product } from "../types";
import { getLocalizedCategoryName } from "../utils/i18nHelpers";
import { storefrontPath } from "../utils/storefrontPaths";
import { getCategoryPhoto } from "../utils/storefrontPhotos";

export default function CategoryGrid({ categories, products, loading }: {
  categories: Category[];
  products: Product[];
  loading: boolean;
}) {
  const { t, i18n } = useTranslation();

  return (
    <section className="store-categories" aria-labelledby="home-categories">
      <header className="store-category-heading">
        <h2 id="home-categories" className="store-display">{t("storefront.categories")}</h2>
      </header>
      {loading && !categories.length ? (
        <div className="store-category-grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="store-category-card" key={index}>
              <div className="store-category-media store-category-placeholder" />
              <div className="store-category-name" />
            </div>
          ))}
        </div>
      ) : categories.length ? (
        <div className="store-category-grid">
          {categories.map((category, index) => (
            <Link to={storefrontPath(`/category/${category.slug}`, i18n.language)}
              key={category.id} className="store-category-card">
              <div className="store-category-media">
                <StorefrontPhoto photo={getCategoryPhoto(category, products)} eager={index < 4} />
              </div>
              <span className="store-category-name">
                {getLocalizedCategoryName(category, i18n.language)}
                <ArrowRight size={17} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : <p className="text-stone-600">{t("home.noCategories")}</p>}
    </section>
  );
}
