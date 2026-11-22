import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Globe2, History, LayoutGrid, Menu, ShoppingBag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useCategoryStore } from "../store/categoryStore";
import { getLocalizedCategoryName } from "../utils/i18nHelpers";
import { getStorefrontLanguage, storefrontPath } from "../utils/storefrontPaths";
import AuthButton from "./auth/AuthButton";

const languages = [
  { code: "ka", label: "ქარ", name: "ქართული" },
  { code: "en", label: "ENG", name: "English" },
  { code: "ru", label: "РУС", name: "Русский" },
] as const;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [open, setOpen] = useState<"catalog" | "language" | "menu" | null>(null);
  const header = useRef<HTMLElement>(null);
  const openedBy = useRef<HTMLButtonElement | null>(null);
  const current = getStorefrontLanguage(i18n.language);
  const cleanPath = storefrontPath(location.pathname, "ka");
  const path = (url: string) => storefrontPath(url, current);
  const activeCategories = categories.filter(category => category.isActive !== false)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const isStaff = user?.role === "admin" || user?.role === "manager";
  const accountLink = user ? (isStaff ? "/admin" : "/order-history") : null;
  const accountLabel = user?.role === "admin" ? t("nav.adminPanel")
    : user?.role === "manager" ? t("nav.posSystem") : t("nav.myOrders");

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(null);
        openedBy.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const close = () => setOpen(null);
  const toggle = (target: NonNullable<typeof open>, button: HTMLButtonElement) => {
    openedBy.current = button;
    setOpen(value => value === target ? null : target);
  };
  const switchLanguage = (code: typeof languages[number]["code"]) => {
    void i18n.changeLanguage(code);
    close();
    const pathname = storefrontPath(location.pathname, code);
    if (pathname !== location.pathname) {
      navigate({ pathname, search: location.search, hash: location.hash }, { replace: true });
    }
  };
  const categoryLinks = activeCategories.map(category => (
    <Link key={category.id} to={path(`/category/${category.slug}`)} onClick={close} className="store-nav-category"
      aria-current={cleanPath === `/category/${category.slug}` ? "page" : undefined}>
      <span className="store-nav-category-image" aria-hidden="true">
        {category.image ? <img src={category.image} alt="" width={32} height={32} /> : <LayoutGrid size={16} />}
      </span>
      <span>{getLocalizedCategoryName(category, current)}</span>
    </Link>
  ));
  const languageButtons = languages.map(language => (
    <button type="button" key={language.code} onClick={() => switchLanguage(language.code)}
      lang={language.code} aria-pressed={language.code === current}>{language.name}</button>
  ));
  const isCatalog = cleanPath === "/products" || cleanPath.startsWith("/category/") || cleanPath.startsWith("/product/");
  const otherLinks = (
    <>
      <Link to={path("/blog")} onClick={close} aria-current={cleanPath.startsWith("/blog") ? "page" : undefined}>{t("nav.blog")}</Link>
      <Link to={path("/about")} onClick={close} aria-current={cleanPath === "/about" ? "page" : undefined}>{t("nav.about")}</Link>
    </>
  );

  return (
    <header className="store-navigation" ref={header}>
      <div className="store-shell store-navigation-row">
        <Link to={path("/")} className="store-wordmark" aria-label={`LifeStore — ${t("nav.home")}`} onClick={close}>
          <span className="store-brand-mark" aria-hidden="true"><img src="/logo.webp" alt="" width={843} height={637} /></span>
          <span>Life Store</span>
        </Link>
        <nav className="store-navigation-desktop" aria-label={t("footer.navigation")}>
          <div className="store-navigation-group">
            <Link to={path("/products")} onClick={close} aria-current={isCatalog ? "page" : undefined}>{t("nav.products")}</Link>
            <button type="button" aria-expanded={open === "catalog"} aria-label={t("storefront.categories")}
              onClick={event => toggle("catalog", event.currentTarget)}><ChevronDown size={17} /></button>
            {open === "catalog" && <div className="store-navigation-popover store-category-popover">{categoryLinks}</div>}
          </div>
          {otherLinks}
        </nav>
        <div className="store-navigation-actions">
          <div className="store-navigation-desktop store-navigation-group">
            <button type="button" className="store-icon-button" aria-expanded={open === "language"}
              aria-label={languages.find(language => language.code === current)?.name}
              onClick={event => toggle("language", event.currentTarget)}>
              <Globe2 size={16} aria-hidden="true" />
              {languages.find(language => language.code === current)?.label}
            </button>
            {open === "language" && <div className="store-navigation-popover store-language-popover">{languageButtons}</div>}
          </div>
          {accountLink && <Link className="store-icon-button store-account-link" to={accountLink} onClick={close}><History size={17} />{accountLabel}</Link>}
          <div className="store-navigation-desktop"><AuthButton /></div>
          <Link className="store-icon-button store-cart-icon" aria-label={`${t("cart.title")} (${totalItems})`} to="/cart" onClick={close}>
            <ShoppingBag size={21} aria-hidden="true" />
            {totalItems > 0 && <span aria-hidden="true">{totalItems}</span>}
          </Link>
          <button type="button" className="store-icon-button store-menu-toggle"
            aria-expanded={open === "menu"} aria-label={open === "menu" ? t("storefront.menuClose") : t("nav.menu")}
            onClick={event => toggle("menu", event.currentTarget)}>
            {open === "menu" ? <X size={23} /> : <Menu size={23} />}
            <span className="hidden min-[370px]:inline">{t("nav.menu")}</span>
          </button>
        </div>
      </div>
      {open === "menu" && (
        <>
          <div className="store-nav-scrim" onClick={close} aria-hidden="true" />
          <nav className="store-navigation-mobile" aria-label={t("footer.navigation")}>
            <Link to={path("/products")} onClick={close} aria-current={isCatalog ? "page" : undefined}>{t("nav.allProducts")}</Link>
            <details>
              <summary>{t("storefront.categories")}<ChevronDown size={16} aria-hidden="true" /></summary>
              {categoryLinks}
            </details>
            {otherLinks}
            {accountLink && <Link to={accountLink} onClick={close}>{accountLabel}</Link>}
            <div className="store-mobile-languages">{languageButtons}</div>
            <AuthButton />
          </nav>
        </>
      )}
    </header>
  );
}
