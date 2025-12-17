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
} from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import type { Product } from "../../../types";
import { getPriorityEmoji } from "../../../utils/priority"; // ✅ იმპორტი

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

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 mt-2">იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            პროდუქტების კატალოგი
          </h3>
          <p className="text-gray-500 text-sm">
            მართეთ თქვენი მაღაზიის ასორტიმენტი, ფასები და პოზიციონირება
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
            სულ:{" "}
            <span className="font-medium text-gray-900">
              {products.length} პროდუქტი
            </span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი პროდუქტი</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            თქვენი კატალოგი ცარიელია
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            დაიწყეთ პროდუქტების დამატება თქვენი ონლაინ მაღაზიის შესაქმნელად.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            პირველი პროდუქტის დამატება
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    პროდუქტი
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    კატეგორია
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ფასი
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    მარაგი
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-blue-50/50 transition-colors duration-200 ${
                      (product.priority || 0) >= 100 ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-gray-200 flex-shrink-0 relative">
                          {product.images.length > 0 ? (
                            <img
                              className="h-full w-full object-cover"
                              src={product.images[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}

                          {/* ✅ Priority Badge on Image */}
                          {(product.priority || 0) > 0 && (
                            <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm p-0.5 rounded-bl-lg text-xs shadow-sm">
                              {getPriorityEmoji(product.priority || 0)}
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {/* ✅ Priority Emoji next to name */}
                            {(product.priority || 0) > 0 && (
                              <span
                                title={`Priority Level: ${product.priority}`}
                              >
                                {getPriorityEmoji(product.priority || 0)}
                              </span>
                            )}
                            {product.name}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            {/* Discount Badge Logic */}
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                  SAVE{" "}
                                  {Math.round(
                                    ((product.originalPrice - product.price) /
                                      product.originalPrice) *
                                      100
                                  )}
                                  %
                                </span>
                              )}
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {product.description
                                ? product.description.substring(0, 40) + "..."
                                : "აღწერის გარეშე"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          ₾{product.price.toFixed(2)}
                        </span>
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₾{product.originalPrice.toFixed(2)}
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.stock < 5
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : product.stock < 10
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {product.stock}
                        </span>
                        {product.stock < 5 && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="flex items-center space-x-2"
                      >
                        {product.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            product.isActive
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {product.isActive ? "აქტიური" : "გაუქმებული"}
                        </span>
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
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
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default ProductManager;
