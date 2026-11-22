import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import type { Category, Product } from "../types";
import { catalogProductView, isCatalogSort, selectCatalogProducts } from "../utils/catalog";
import { getLocalizedCategoryName } from "../utils/i18nHelpers";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 12;

export default function Catalog({ products, categories, category, loading, defaultSort = "recommended" }: {
  products: Product[];
  categories: Category[];
  category?: Category;
  loading: boolean;
  defaultSort?: "recommended" | "newest";
}) {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const resultsTop = useRef<HTMLDivElement>(null);
  const query = params.get("q") ?? "";
  const inStock = params.get("stock") === "1";
  const onSale = params.get("sale") === "1";
  const requestedSort = params.get("sort");
  const sort = isCatalogSort(requestedSort) && (requestedSort !== "recommended" || defaultSort === "recommended")
    ? requestedSort
    : defaultSort;
  const chosenCategory = category ?? categories.find(item => item.slug === params.get("category"));
  const productsToShow = selectCatalogProducts(products, { category: chosenCategory, query, inStock, onSale, sort, language: i18n.language });
  const pageCount = Math.max(1, Math.ceil(productsToShow.length / PAGE_SIZE));
  const requestedPage = Number(params.get("page"));
  const page = Number.isInteger(requestedPage) ? Math.min(pageCount, Math.max(1, requestedPage)) : 1;
  const visible = productsToShow.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const update = (changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace, preventScrollReset: true });
  };
  const clear = () => update({ q: "", stock: "", sale: "", category: "" });
  const active = [
    ...(!category && chosenCategory ? [{ key: "category", label: getLocalizedCategoryName(chosenCategory, i18n.language) }] : []),
    ...(inStock ? [{ key: "stock", label: t("catalog.inStock") }] : []),
    ...(onSale ? [{ key: "sale", label: t("catalog.onSale") }] : []),
  ];
  const changePage = (next: number) => {
    update({ page: next > 1 ? String(next) : "" });
    resultsTop.current?.scrollIntoView({ block: "start" });
  };

  return (
    <section className="catalog" aria-label={t("nav.products")}>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={19} aria-hidden="true" />
          <input type="search" aria-label={t("catalog.search")} placeholder={t("catalog.search")}
            value={query} onChange={event => update({ q: event.target.value }, true)} />
        </label>
        <button type="button" className="catalog-control" aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}>
          <SlidersHorizontal size={17} aria-hidden="true" />
          {t("catalog.filters")}{active.length > 0 && <span className="catalog-filter-count">{active.length}</span>}
        </button>
        <label className="catalog-control catalog-sort">
          <select aria-label={t("catalog.sort")} value={sort} onChange={event => update({ sort: event.target.value === defaultSort ? "" : event.target.value })}>
            {defaultSort === "recommended" && <option value="recommended">{t("catalog.recommended")}</option>}
            <option value="newest">{t("catalog.newest")}</option>
            <option value="price-asc">{t("catalog.priceAsc")}</option>
            <option value="price-desc">{t("catalog.priceDesc")}</option>
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        {expanded && (
          <div className="catalog-filter-panel">
            {!category && categories.length > 0 && (
              <label className="catalog-category-select">
                <span>{t("product.category")}</span>
                <select value={chosenCategory?.slug ?? ""} onChange={event => update({ category: event.target.value })}>
                  <option value="">{t("catalog.allCategories")}</option>
                  {categories.map(item => (
                    <option key={item.id} value={item.slug}>{getLocalizedCategoryName(item, i18n.language)}</option>
                  ))}
                </select>
              </label>
            )}
            <label><input type="checkbox" checked={inStock} onChange={event => update({ stock: event.target.checked ? "1" : "" })} />{t("catalog.inStock")}</label>
            <label><input type="checkbox" checked={onSale} onChange={event => update({ sale: event.target.checked ? "1" : "" })} />{t("catalog.onSale")}</label>
          </div>
        )}
      </div>
      <div ref={resultsTop} className="catalog-results">
        <p role="status">{!loading && t("home.productCount", { count: productsToShow.length })}</p>
        <div className="catalog-active">
          {active.map(item => (
            <button key={item.key} type="button" onClick={() => update({ [item.key]: "" })} aria-label={t("catalog.remove", { filter: item.label })}>
              {item.label}<X size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="store-product-grid" aria-busy="true" aria-label={t("common.loading")}>
          {Array.from({ length: PAGE_SIZE }, (_, index) => <div className="catalog-placeholder" key={index} />)}
        </div>
      ) : visible.length ? (
        <div className="store-product-grid">
          {visible.map(product => (
            <ProductCard key={product.id} product={catalogProductView(product, inStock, onSale)} />
          ))}
        </div>
      ) : (
        <div className="store-empty">
          <h2>{t("home.nothingFound")}</h2>
          <p>{t("catalog.tryAgain")}</p>
          {(query || active.length > 0) && <button type="button" className="store-button" onClick={clear}>{t("common.clearFilters")}</button>}
        </div>
      )}
      {pageCount > 1 && (
        <nav className="catalog-pagination" aria-label={t("catalog.pages")}>
          <button type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>{t("catalog.previous")}</button>
          <span aria-live="polite">{page} / {pageCount}</span>
          <button type="button" disabled={page === pageCount} onClick={() => changePage(page + 1)}>{t("catalog.next")}</button>
        </nav>
      )}
    </section>
  );
}
