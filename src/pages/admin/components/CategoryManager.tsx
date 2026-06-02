import React, { useState, useEffect, useRef } from "react";
import { useCategoryStore } from "../../../store/categoryStore";
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Upload, X, Loader2 } from "lucide-react";
import { showToast } from "../../../components/ui/Toast";
import { useCloudinaryUpload } from "../../../hooks/useCloudinaryUpload";
import type { Category } from "../../../types";
import { generateProductSlug } from "../../../utils/slug";
import RichTextEditor from "../../../components/ui/RichTextEditor";

const CategoryManager: React.FC = () => {
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, isLoading } = useCategoryStore();
  const { uploading, uploadImage } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Category, "id" | "createdAt" | "updatedAt">>({
    name: "",
    slug: "",
    description: "",
    nameEn: "",
    nameRu: "",
    descriptionEn: "",
    descriptionRu: "",
    seoContent: "",
    seoContentEn: "",
    seoContentRu: "",
    image: "",
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "priority" ? parseInt(value) || 0 : value,
    }));
  };

  const generateSlug = (name: string) => generateProductSlug(name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      showToast("სახელი და slug აუცილებელია", "error");
      return;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        showToast("კატეგორია განახლდა", "success");
      } else {
        await addCategory(formData);
        showToast("კატეგორია დამატებულია", "success");
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      showToast("შეცდომა ოპერაციის დროს", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("სურათი იტვირთება...", "info");
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
      showToast("სურათი აიტვირთა", "success");
    } catch (error) {
      showToast("სურათის ატვირთვა ვერ მოხერხდა", "error");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      nameEn: category.nameEn || "",
      nameRu: category.nameRu || "",
      descriptionEn: category.descriptionEn || "",
      descriptionRu: category.descriptionRu || "",
      seoContent: category.seoContent || "",
      seoContentEn: category.seoContentEn || "",
      seoContentRu: category.seoContentRu || "",
      image: category.image,
      isActive: category.isActive,
      priority: category.priority,
    });
    setEditingId(category.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("ნამდვილად გსურთ წაშლა?")) {
      try {
        await deleteCategory(id);
        showToast("კატეგორია წაიშალა", "success");
      } catch (error) {
        showToast("შეცდომა წაშლის დროს", "error");
      }
    }
  };

  const handlePriorityChange = async (id: string, direction: "up" | "down") => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    // Up = მაღალი პრიორიტეტი (+1), Down = დაბალი პრიორიტეტი (-1)
    const newPriority = direction === "up" ? (category.priority || 0) + 1 : (category.priority || 0) - 1;
    await updateCategory(id, { priority: newPriority });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      nameEn: "",
      nameRu: "",
      descriptionEn: "",
      descriptionRu: "",
      seoContent: "",
      seoContentEn: "",
      seoContentRu: "",
      image: "",
      isActive: true,
      priority: 0,
    });
    setEditingId(null);
  };

  // უმაღლესი პრიორიტეტი (მაღალი ციფრი) -> პირველი
  const sortedCategories = [...categories].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">კატეგორიები</h2>
          <p className="text-sm text-gray-600 mt-1">საიტის კატეგორიების მართვა</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          ახალი კატეგორია
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">ტვირთვა...</div>
        ) : sortedCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">კატეგორიები ამ დროს არ არის</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">სახელი</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">აღწერილობა</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900">სტატუსი</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900">პრიორიტეტი</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900">ქმედებები</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">/{category.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description ? category.description.substring(0, 30) + "..." : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          category.isActive !== false
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {category.isActive !== false ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePriorityChange(category.id, "up")}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="ზემოთ"
                        >
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">{category.priority || 0}</span>
                        <button
                          onClick={() => handlePriorityChange(category.id, "down")}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="ქვემოთ"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 hover:bg-blue-100 rounded transition-colors text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
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
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? "რედაქტირება" : "ახალი კატეგორია"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">სახელი *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="მაგ: ლანჩბოქსი"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Slug (URL) *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="lunchbox"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">კატეგორიის სურათი</label>
                <div className="space-y-2">
                  {formData.image && (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="Category preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image: "",
                          }))
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ატვირთვა...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        სურათის არჩევა
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">აღწერილობა</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="კატეგორიის აღწერილობა"
                  rows={3}
                />
              </div>

              {/* Translations */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/40 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">🌍 თარგმანები (EN / RU)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">სახელი EN</label>
                    <input
                      type="text"
                      name="nameEn"
                      value={formData.nameEn || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Lunchbox"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">სახელი RU</label>
                    <input
                      type="text"
                      name="nameRu"
                      value={formData.nameRu || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Ланчбокс"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">აღწერა EN</label>
                  <textarea
                    name="descriptionEn"
                    value={formData.descriptionEn || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Category description in English"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">აღწერა RU</label>
                  <textarea
                    name="descriptionRu"
                    value={formData.descriptionRu || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Описание категории на русском"
                  />
                </div>
              </div>

              {/* Long-form SEO content (HTML) — rendered below the product grid */}
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/40 space-y-3">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  📝 SEO ტექსტი (გრძელი, არასავალდებულო)
                </p>
                <p className="text-xs text-gray-500">
                  H2/სიის მქონე ვრცელი ტექსტი — ჩანს პროდუქტების ქვემოთ. Google-ისთვის უნიკალური კონტენტი.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ქართული 🇬🇪</label>
                  <RichTextEditor
                    value={formData.seoContent || ""}
                    onChange={(html) => setFormData((prev) => ({ ...prev, seoContent: html }))}
                    placeholder="რატომ ავირჩიოთ ეს კატეგორია, როგორ შევარჩიოთ, მასალა, მოვლა..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">English 🇬🇧</label>
                  <RichTextEditor
                    value={formData.seoContentEn || ""}
                    onChange={(html) => setFormData((prev) => ({ ...prev, seoContentEn: html }))}
                    placeholder="Optional — full SEO content in English"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Русский 🇷🇺</label>
                  <RichTextEditor
                    value={formData.seoContentRu || ""}
                    onChange={(html) => setFormData((prev) => ({ ...prev, seoContentRu: html }))}
                    placeholder="Опционально — полный SEO-текст на русском"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">პრიორიტეტი</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority || 0}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-900">აქტიური</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? "განახლება" : "შექმნა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
