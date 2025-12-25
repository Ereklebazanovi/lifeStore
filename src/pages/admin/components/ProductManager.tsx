import React, { useState } from "react";
import { useProductStore } from "../../../store/productStore";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  AlertTriangle,
  Package,
  Star,
  DollarSign,
} from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import type { Product } from "../../../types";
import { getPriorityEmoji } from "../../../utils/priority";

const ProductManager: React.FC = () => {
  const { products, isLoading, deleteProduct, toggleProductStatus } = useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ "${name}" პროდუქტის წაშლა?`)) {
      await deleteProduct(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleProductStatus(id);
  };

  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return "bg-red-100 text-red-800";
    if (stock <= 3) return "bg-amber-100 text-amber-800";
    if (stock <= 10) return "bg-yellow-100 text-yellow-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const getStockStatusText = (stock: number) => {
    if (stock <= 0) return "ამოიწურა";
    if (stock <= 3) return "კრიტიკული";
    if (stock <= 10) return "დაბალი";
    return "კარგია";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 ml-3">იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">პროდუქტების მართვა</h2>
            <p className="text-gray-600 text-sm mt-1">მართეთ მაღაზიის ასორტიმენტი და ფასები</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-600">სულ: </span>
              <span className="font-semibold text-gray-900">{products.length} პროდუქტი</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>ახალი პროდუქტი</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">პროდუქტები არ არის</h3>
          <p className="text-gray-600 mb-6">დაამატეთ თქვენი პირველი პროდუქტი რომ დაიწყოთ გაყიდვები</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>პირველი პროდუქტის დამატება</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    პროდუქტი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ფასი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    მარაგი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.imageUrl ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                            {product.priority && (
                              <span className="ml-2 text-xs">
                                {getPriorityEmoji(product.priority)}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          ₾{product.price.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{product.stock}</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(
                            product.stock
                          )}`}
                        >
                          {getStockStatusText(product.stock)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="flex items-center space-x-2 group"
                      >
                        {product.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700" />
                            <span className="text-sm text-emerald-600">აქტიური</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-500" />
                            <span className="text-sm text-gray-500">გამორთული</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                          title="რედაქტირება"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={() => {
            setIsAddModalOpen(false);
          }}
        />
      )}

      {isEditModalOpen && selectedProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onProductUpdated={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManager;