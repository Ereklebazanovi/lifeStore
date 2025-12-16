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
  priority: number; // 1 = highest, 3 = lowest
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
      <div
        className={`bg-emerald-50 border border-emerald-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-emerald-900">
            მარაგის მდგომარეობა
          </h3>
        </div>
        <p className="text-xs text-emerald-700 mt-2">
          ყველა პროდუქტი საკმარისი რაოდენობითაა ხელმისაწვდომი
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-stone-200 rounded-lg ${className}`}>
      {showTitle && (
        <div className="px-4 py-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-stone-900">
                მარაგის გაფრთხილებები
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {stats.outOfStock > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  {stats.outOfStock} ამოიწურა
                </span>
              )}
              {stats.criticalStock > 0 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  {stats.criticalStock} კრიტიკული
                </span>
              )}
              {stats.lowStock > 0 && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                  {stats.lowStock} დაბალი
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.product.id}-${alert.type}`}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertStyles(
              alert.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900">
                {alert.message}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-stone-500">
                  ფასი: ₾{alert.product.price.toFixed(2)}
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs text-stone-500">
                  კატეგორია: {alert.product.category}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {alert.type === "out_of_stock" ? (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  ამოიწურა
                </span>
              ) : (
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full font-medium">
                  {alert.product.stock} ცალი
                </span>
              )}
            </div>
          </div>
        ))}

        {alerts.length >= maxAlerts && (
          <div className="text-center pt-2">
            <p className="text-xs text-stone-500">
              არის კიდევ{" "}
              {stats.outOfStock +
                stats.criticalStock +
                stats.lowStock -
                maxAlerts}{" "}
              გაფრთხილება...
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
      return "bg-red-50 border-red-200";
    case "critical_stock":
      return "bg-orange-50 border-orange-200";
    case "low_stock":
      return "bg-yellow-50 border-yellow-200";
    default:
      return "bg-stone-50 border-stone-200";
  }
}

function getAlertIcon(type: InventoryAlert["type"]) {
  switch (type) {
    case "out_of_stock":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "critical_stock":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "low_stock":
      return <TrendingDown className="w-4 h-4 text-yellow-500" />;
    default:
      return <Package className="w-4 h-4 text-stone-500" />;
  }
}

export default InventoryAlerts;
