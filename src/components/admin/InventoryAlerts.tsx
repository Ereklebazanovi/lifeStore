// src/components/admin/InventoryAlerts.tsx
import React, { useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Package,
  TrendingDown,
} from "lucide-react";
import { useProductStore } from "../../store/productStore";
import type { Product } from "../../types";

interface InventoryAlert {
  type: "out_of_stock" | "low_stock" | "critical_stock";
  product: Product;
  message: string;
  priority: number;
}

interface InventoryAlertsProps {
  className?: string;
  maxAlerts?: number;
  showTitle?: boolean;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  className = "",
  maxAlerts = 5,
  showTitle = true,
}) => {
  const { products } = useProductStore();

  // Calculate inventory alerts
  const alerts = useMemo(() => {
    const alertsArray: InventoryAlert[] = [];

    products.forEach((product) => {
      if (!product.isActive) return; // Skip inactive products

      if (product.stock <= 0) {
        alertsArray.push({
          type: "out_of_stock",
          product,
          message: `"${product.name}" - მარაგი ამოიწურა`,
          priority: 1,
        });
      } else if (product.stock <= 3) {
        alertsArray.push({
          type: "critical_stock",
          product,
          message: `"${product.name}" - კრიტიკული დონე (${product.stock} ცალი)`,
          priority: 2,
        });
      } else if (product.stock <= 10) {
        alertsArray.push({
          type: "low_stock",
          product,
          message: `"${product.name}" - დაბალი მარაგი (${product.stock} ცალი)`,
          priority: 3,
        });
      }
    });

    // Sort by priority and limit results
    return alertsArray
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxAlerts);
  }, [products, maxAlerts]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const outOfStock = products.filter(
      (p) => p.isActive && p.stock <= 0
    ).length;
    const criticalStock = products.filter(
      (p) => p.isActive && p.stock > 0 && p.stock <= 3
    ).length;
    const lowStock = products.filter(
      (p) => p.isActive && p.stock > 3 && p.stock <= 10
    ).length;
    const totalProducts = products.filter((p) => p.isActive).length;

    return { outOfStock, criticalStock, lowStock, totalProducts };
  }, [products]);

  if (alerts.length === 0) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-md sm:rounded-lg p-3 sm:p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-emerald-900">
            მარაგის მდგომარეობა შესანიშნავია! ✅
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-emerald-700 mt-1 sm:mt-2">
          ყველა პროდუქტი საკმარისი რაოდენობითაა ხელმისაწვდომი
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              მარაგის გაფრთხილებები
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {stats.outOfStock > 0 && (
              <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full font-medium">
                {stats.outOfStock} ამოიწურა
              </span>
            )}
            {stats.criticalStock > 0 && (
              <span className="bg-amber-100 text-amber-800 px-2 sm:px-3 py-1 rounded-full font-medium">
                {stats.criticalStock} კრიტიკული
              </span>
            )}
            {stats.lowStock > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full font-medium">
                {stats.lowStock} დაბალი
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.product.id}-${alert.type}`}
            className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-md sm:rounded-lg border-l-4 ${getAlertStyles(
              alert.type
            )}`}
          >
            {/* Product Image */}
            <div className="flex-shrink-0">
              <img
                src={alert.product.images?.[0] || '/placeholder-product.png'}
                alt={alert.product.name}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-md sm:rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                }}
              />
            </div>

            {/* Alert Icon */}
            <div className="flex-shrink-0 mt-0.5 sm:mt-1">
              {getAlertIcon(alert.type)}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm md:text-base">
                {alert.message}
              </p>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  📦 {alert.product.category}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  💰 ₾{alert.product.price.toFixed(2)}
                </span>
                {alert.product.priority && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      ⭐ {alert.product.priority}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex-shrink-0">
              {alert.type === "out_of_stock" ? (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  ❌ ამოიწურა
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                  📊 {alert.product.stock} ცალი
                </span>
              )}
            </div>
          </div>
        ))}

        {alerts.length >= maxAlerts && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              არის კიდევ{" "}
              <span className="font-semibold text-gray-900">
                {stats.outOfStock + stats.criticalStock + stats.lowStock - maxAlerts}
              </span>{" "}
              გაფრთხილება...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              სრული სია ხელმისაწვდომია მარაგის სექციაში
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getAlertStyles(type: InventoryAlert["type"]): string {
  switch (type) {
    case "out_of_stock":
      return "bg-red-50 border-red-400";
    case "critical_stock":
      return "bg-amber-50 border-amber-400";
    case "low_stock":
      return "bg-yellow-50 border-yellow-400";
    default:
      return "bg-gray-50 border-gray-400";
  }
}

function getAlertIcon(type: InventoryAlert["type"]) {
  switch (type) {
    case "out_of_stock":
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    case "critical_stock":
      return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    case "low_stock":
      return <TrendingDown className="w-6 h-6 text-yellow-600" />;
    default:
      return <Package className="w-6 h-6 text-gray-600" />;
  }
}

export default InventoryAlerts;