import React, { useState } from "react";
import { useProductStore } from "../../../store/productStore";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Package,
  DollarSign,
} from "lucide-react";
import AddProductDrawer from "./AddProductDrawer";
import EditProductModalVariants from "./EditProductModalVariants";
import type { Product } from "../../../types";
import { getPriorityEmoji } from "../../../utils/priority";
import { getTotalStock } from "../../../utils/stock";

const ProductManager: React.FC = () => {
  const { products, isLoading, deleteProduct, toggleProductStatus } =
    useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (
      window.confirm(`დარწმუნებული ხართ, რომ გსურთ "${name}" პროდუქტის წაშლა?`)
    ) {
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

  // ჯამური მარაგების გამოთვლა ყველა პროდუქტისთვის
  const totalStock = products.reduce((sum, product) => {
    return sum + getTotalStock(product);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 ml-3">იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-md sm:rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              პროდუქტების მართვა
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              მართეთ მაღაზიის ასორტიმენტი და ფასები
            </p>
          </div>

          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-blue-50 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-blue-200">
              <span className="text-blue-600 block text-xs truncate">სულ მარაგში:</span>
              <span className="font-bold text-blue-800 text-xs sm:text-sm">
                {totalStock} ცალი
              </span>
            </div>
            <div className="bg-gray-100 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm">
              <span className="text-gray-600 block text-xs truncate">სულ:</span>
              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                {products.length} პროდუქტი
              </span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="col-span-2 lg:col-span-1 flex items-center justify-center space-x-1 sm:space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">ახალი პროდუქტი</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            პროდუქტები არ არის
          </h3>
          <p className="text-gray-600 mb-6">
            დაამატეთ თქვენი პირველი პროდუქტი რომ დაიწყოთ გაყიდვები
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>პირველი პროდუქტის დამატება</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      პროდუქტი
                    </th>
                    <th className="px-2 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ფასი
                    </th>
                    <th className="px-2 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მარაგი
                    </th>
                    <th className="px-2 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      სტატუსი
                    </th>
                    <th className="px-2 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 lg:h-12 lg:w-12">
                            {product.images?.[0] ? (
                              <img
                                className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover"
                                src={product.images[0]}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-2 lg:ml-4">
                            <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                              {product.name}
                              {product.priority != null && product.priority > 0 && (
                                <span className="ml-1 lg:ml-2 text-xs">
                                  {getPriorityEmoji(product.priority)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-500 truncate">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 lg:px-6 py-3 lg:py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2">
                          {product.salePrice && product.salePrice > 0 ? (
                            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2">
                              <span className="text-xs lg:text-sm text-gray-500 line-through">
                                ₾{product.price.toFixed(2)}
                              </span>
                              <span className="text-xs lg:text-sm font-semibold text-red-600">
                                ₾{product.salePrice.toFixed(2)}
                              </span>
                              <span className="px-1.5 lg:px-2 py-0.5 lg:py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mt-1 lg:mt-0 self-start">
                                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs lg:text-sm font-semibold text-gray-900">
                              ₾{product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 lg:px-6 py-3 lg:py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2">
                          <span className="text-xs lg:text-sm font-medium text-gray-900">
                            {getTotalStock(product)}
                          </span>
                          <span
                            className={`px-1.5 lg:px-2 py-0.5 lg:py-1 text-xs font-medium rounded-full mt-1 lg:mt-0 self-start ${getStockStatusColor(
                              getTotalStock(product)
                            )}`}
                          >
                            {getStockStatusText(getTotalStock(product))}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 lg:px-6 py-3 lg:py-4">
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          className="flex items-center space-x-1 lg:space-x-2 group"
                        >
                          {product.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 group-hover:text-emerald-700" />
                              <span className="text-xs lg:text-sm text-emerald-600 hidden lg:inline">
                                აქტიური
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-gray-500" />
                              <span className="text-xs lg:text-sm text-gray-500 hidden lg:inline">
                                გამორთული
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-2 lg:px-6 py-3 lg:py-4 text-sm font-medium">
                        <div className="flex space-x-1 lg:space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-700 p-1 lg:p-1 rounded hover:bg-blue-50"
                            title="რედაქტირება"
                          >
                            <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            className="text-red-600 hover:text-red-700 p-1 lg:p-1 rounded hover:bg-red-50"
                            title="წაშლა"
                          >
                            <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-md sm:rounded-lg shadow-sm p-3 sm:p-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover"
                        src={product.images[0]}
                        alt={product.name}
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {product.name}
                          {product.priority != null && product.priority > 0 && (
                            <span className="ml-1 sm:ml-2 text-xs">
                              {getPriorityEmoji(product.priority)}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{product.category}</p>
                      </div>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="flex items-center space-x-1 group flex-shrink-0"
                      >
                        {product.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700" />
                            <span className="text-xs text-emerald-600 hidden sm:inline">აქტიური</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
                            <span className="text-xs text-gray-500 hidden sm:inline">გამორთული</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Price and Stock */}
                    <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />
                          {product.salePrice && product.salePrice > 0 ? (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span className="text-xs sm:text-sm text-gray-500 line-through">
                                ₾{product.price.toFixed(2)}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-red-600">
                                ₾{product.salePrice.toFixed(2)}
                              </span>
                              <span className="px-1 sm:px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              ₾{product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {getTotalStock(product)}
                          </span>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getStockStatusColor(
                              getTotalStock(product)
                            )}`}
                          >
                            {getStockStatusText(getTotalStock(product))}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-50"
                          title="რედაქტირება"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 rounded-lg hover:bg-red-50"
                          title="წაშლა"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddProductDrawer
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={() => {
            setIsAddModalOpen(false);
          }}
        />
      )}

      {isEditModalOpen && selectedProduct && (
        <EditProductModalVariants
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
