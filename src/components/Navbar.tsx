"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Badge } from "antd"
import { ShoppingCart, Menu, X, ShieldCheck, User, LogOut, LogIn, History, Search } from "lucide-react"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import AuthButton from "./auth/AuthButton"

const Navbar: React.FC = () => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { totalItems } = useCartStore()
  const { user, signInWithGoogle, signOut } = useAuthStore()

  const isActivePath = (path: string) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [location])

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  const handleMobileSignIn = async () => {
    setIsMenuOpen(false)
    await signInWithGoogle()
  }

  const handleMobileSignOut = async () => {
    setIsMenuOpen(false)
    await signOut()
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-neutral-200/50"
            : "bg-white/95 backdrop-blur-md border-b border-neutral-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            <Link to="/" className="flex items-center space-x-2.5 group z-50 relative">
              <div className="relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <img src="/Screenshot 2025-12-10 151703.png" alt="LifeStore" className="h-11 w-auto object-cover" />
              </div>
              <span className="text-[22px] font-extrabold bg-gradient-to-r from-neutral-900 via-emerald-800 to-emerald-600 bg-clip-text text-transparent tracking-tight group-hover:tracking-normal transition-all duration-300">
                LifeStore
              </span>
            </Link>

            <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-1">
              <NavLink to="/" isActive={isActivePath("/")}>
                მთავარი
              </NavLink>
              <NavLink to="/products" isActive={isActivePath("/products")}>
                პროდუქტები
              </NavLink>
              <NavLink to="/about" isActive={isActivePath("/about")}>
                ჩვენ შესახებ
              </NavLink>

              {user && (
                <Link
                  to="/order-history"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActivePath("/order-history")
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50/80"
                  }`}
                >
                  <History className="w-[18px] h-[18px]" />
                  <span className="hidden lg:inline">ჩემი შეკვეთები</span>
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActivePath("/admin")
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30"
                      : "text-neutral-700 hover:text-orange-600 hover:bg-orange-50/80"
                  }`}
                >
                  <ShieldCheck className="w-[18px] h-[18px]" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              {user?.role === "manager" && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActivePath("/admin")
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md shadow-blue-500/30"
                      : "text-neutral-700 hover:text-blue-600 hover:bg-blue-50/80"
                  }`}
                >
                  <ShieldCheck className="w-[18px] h-[18px]" />
                  <span className="hidden lg:inline">POS სისტემა</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
             
              {/* Desktop Auth Button */}
              <div className="hidden md:block">
                <AuthButton />
              </div>

              <Link to="/cart" className="group relative">
                <Badge
                  count={totalItems}
                  size="small"
                  color="#10b981"
                  offset={[-6, 6]}
                  style={{
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}
                >
                  <div className="p-2.5 rounded-xl text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all duration-300 border border-neutral-100 group-hover:border-emerald-200 group-hover:shadow-sm">
                    <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                </Badge>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2.5 text-neutral-700 hover:bg-neutral-100/80 rounded-xl transition-all duration-300 active:scale-95 z-50 ml-1"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isSearchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="ძიება პროდუქტების..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 text-neutral-900 placeholder:text-neutral-400 shadow-sm"
                autoFocus
              />
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${
          isMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />

        <div
          className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center px-5 h-[72px] border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
            <span className="text-xl font-extrabold bg-gradient-to-r from-neutral-900 to-emerald-600 bg-clip-text text-transparent tracking-tight">
              LifeStore
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 bg-white rounded-xl shadow-sm text-neutral-500 hover:text-neutral-700 hover:shadow transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-72px)] pt-6 px-5 pb-6 overflow-y-auto">
            

            <div className="space-y-1.5 mb-6">
              <MobileNavLink to="/" isActive={isActivePath("/")} onClick={() => setIsMenuOpen(false)}>
                მთავარი
              </MobileNavLink>
              <MobileNavLink to="/products" isActive={isActivePath("/products")} onClick={() => setIsMenuOpen(false)}>
                პროდუქტები
              </MobileNavLink>
              <MobileNavLink to="/about" isActive={isActivePath("/about")} onClick={() => setIsMenuOpen(false)}>
                ჩვენ შესახებ
              </MobileNavLink>

              {user && (
                <Link
                  to="/order-history"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/30 mt-3"
                >
                  <History className="w-[18px] h-[18px]" />
                  ჩემი შეკვეთები
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-md shadow-orange-500/30 mt-2"
                >
                  <ShieldCheck className="w-[18px] h-[18px]" />
                  ადმინ პანელი
                </Link>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-neutral-200">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {user.displayName?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="font-bold text-neutral-900 text-sm truncate">
                        {user.displayName || "მომხმარებელი"}
                      </p>
                      <p className="text-xs text-neutral-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleMobileSignOut}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition-all duration-300"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                    გასვლა
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMobileSignIn}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-emerald-500/30"
                >
                  <LogIn className="w-5 h-5" />
                  შესვლა
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const NavLink = ({ to, isActive, children }: { to: string; isActive: boolean; children: React.ReactNode }) => (
  <Link
    to={to}
    className={`relative text-sm font-semibold transition-all duration-300 py-2.5 px-4 rounded-xl group ${
      isActive ? "text-emerald-600 bg-emerald-50/80" : "text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50/50"
    }`}
  >
    {children}
    {isActive && (
      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full" />
    )}
  </Link>
)

const MobileNavLink = ({
  to,
  isActive,
  children,
  onClick,
}: { to: string; isActive: boolean; children: React.ReactNode; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
        : "text-neutral-700 hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
    }`}
  >
    {children}
  </Link>
)

export default Navbar
