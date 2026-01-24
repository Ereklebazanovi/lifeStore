// src/pages/admin/components/AdminLayout.tsx
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  Warehouse,
  User,
  LogOut,
  Menu,
  X,
  Layers,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

interface NavItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  count?: number;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = "dashboard",
  onSectionChange = () => {},
}) => {
  const { user, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    if (typeof window !== "undefined") {
      checkScreenSize();
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // 1. ყველა შესაძლო მენიუს ელემენტი
  const allNavItems: NavItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "მთავარი" },
    { id: "products", icon: Package, label: "პროდუქტები" },
    { id: "orders", icon: ShoppingBag, label: "შეკვეთები" },
    { id: "inventory", icon: Warehouse, label: "საწყობი" },
    { id: "categories", icon: Layers, label: "კატეგორიები" },
    { id: "analytics", icon: BarChart3, label: "ანალიტიკა" },
  ];

  // Enhanced Role-based navigation
  const navigationItems = allNavItems.filter((item) => {
    const userRole = user?.role;

    switch (userRole) {
      case "admin":
        return true; // Admin sees everything

      case "manager":
        // Managers can access: dashboard, orders, inventory (view only)
        return ["dashboard", "orders", "inventory"].includes(item.id);

      case "warehouse":
        // Warehouse staff can access: dashboard, inventory (full control), products (view only)
        return ["dashboard", "inventory", "products"].includes(item.id);

      default:
        return ["dashboard"].includes(item.id); // Safe default
    }
  });

  // კომპონენტი ღილაკისთვის (კოდის დუბლირების თავიდან ასაცილებლად)
  const SidebarNavItem: React.FC<
    NavItem & { isActive: boolean; onClick: () => void; collapsed?: boolean }
  > = ({ icon: Icon, label, count, isActive, onClick, collapsed }) => (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }
        ${collapsed ? "justify-center px-2" : ""}
      `}
    >
      <Icon className="w-5 h-5 min-w-[20px]" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && count && (
        <span
          className={`
          px-2 py-1 text-xs rounded-full
          ${isActive ? "bg-white/20" : "bg-gray-200 text-gray-600"}
        `}
        >
          {count}
        </span>
      )}
    </button>
  );


  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {!isDesktop && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!isDesktop && (
        <aside
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-900">LifeStore</h1>
              <p className="text-xs text-gray-500">
                {user?.role === "admin"
                  ? "ადმინისტრატორი"
                  : user?.role === "manager"
                  ? "მენეჯერი"
                  : user?.role === "warehouse"
                  ? "საწყობი"
                  : "სისტემა"}
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                {...item}
                isActive={activeSection === item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>
        </aside>
      )}

      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside
          className={`
            flex flex-col fixed inset-y-0 left-0 z-30
            ${isSidebarOpen ? "w-64" : "w-16"}
            bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
          `}
        >
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 h-16 flex items-center justify-center overflow-hidden">
            {isSidebarOpen ? (
              <div className="w-full">
                <h1 className="text-lg font-bold text-gray-900">LifeStore</h1>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === "admin"
                    ? "ადმინ პანელი"
                    : user?.role === "manager"
                    ? "მენეჯერი (POS)"
                    : user?.role === "warehouse"
                    ? "საწყობი"
                    : "სისტემა"}
                </p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation - აი ეს აკლდა Claude-ის კოდს! */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                {...item}
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
                collapsed={!isSidebarOpen}
              />
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-200">
            {isSidebarOpen ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.role === "admin"
                        ? "ადმინი"
                        : user?.role === "manager"
                        ? "მენეჯერი"
                        : user?.role === "warehouse"
                        ? "საწყობი"
                        : "მომხმარებელი"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>გასვლა</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-help"
                  title={user?.email || ""}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  title="გასვლა"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div
        className="flex flex-col h-full transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isDesktop ? (isSidebarOpen ? "256px" : "64px") : "0px",
        }}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            {!isDesktop && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-blue-600 text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {isDesktop && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            <h1 className="text-lg font-semibold text-gray-900 capitalize">
              {allNavItems.find((i) => i.id === activeSection)?.label ||
                activeSection}
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString("ka-GE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
