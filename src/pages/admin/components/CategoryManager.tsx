import React, { useState, useEffect, useRef } from "react";
import { useCategoryStore } from "../../../store/categoryStore";
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Upload, X, Loader2, Crop, Copy, Check, Info } from "lucide-react";
import { showToast } from "../../../components/ui/Toast";
import { useCloudinaryUpload } from "../../../hooks/useCloudinaryUpload";
import type { Category } from "../../../types";
import { generateProductSlug } from "../../../utils/slug";
import RichTextEditor from "../../../components/ui/RichTextEditor";
import ImageCropperModal from "../../../components/ui/ImageCropperModal";

const CATEGORY_GPT_PROMPT =
  "დამიგენერირე კვადრატული სურათი (1:1 პროპორცია, 1024x1024 px ან 800x800 px). მთავარი ნივთი მოათავსე ცენტრში და გარშემო (განსაკუთრებით ქვედა ნაწილში, სადაც კატეგორიის სახელი ეწერება) დატოვე თავისუფალი სივრცე, რომ ჩარჩოში ჩასმისას კიდეები არ ჩამოიჭრას.";

const CategoryManager: React.FC = () => {
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, isLoading } = useCategoryStore();
  const { uploading, uploadImage } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string; file?: File; fileName: string } | null>(null);
  const [copiedGpt, setCopiedGpt] = useState(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCropTarget({
      src: objectUrl,
      file,
      fileName: file.name,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cleanupCropTarget = () => {
    if (cropTarget?.src.startsWith("blob:")) {
      URL.revokeObjectURL(cropTarget.src);
    }
    setCropTarget(null);
  };

  const uploadCategoryFile = async (fileToUpload: File) => {
    cleanupCropTarget();
    try {
      showToast("სურათი იტვირთება...", "info");
      const imageUrl = await uploadImage(fileToUpload);
      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
      showToast("სურათი აიტვირთა", "success");
    } catch (error) {
      showToast("სურათის ატვირთვა ვერ მოხერხდა", "error");
    }
  };

  const handleCopyGptPrompt = () => {
    navigator.clipboard.writeText(CATEGORY_GPT_PROMPT);
    setCopiedGpt(true);
    showToast("ChatGPT-ის ზომის ინსტრუქცია დაკოპირდა", "success");
    setTimeout(() => setCopiedGpt(false), 2500);
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
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0 bg-stone-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-400">
                            —
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">/{category.slug}</div>
                        </div>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-900">კატეგორიის სურათი</label>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    ზომა: 800 × 800 px ან 1024 × 1024 px (1:1 კვადრატი)
                  </span>
                </div>

                {/* Dimensions & ChatGPT helper info */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 mb-3 text-xs text-stone-700 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-stone-900">
                          იდეალური ზომა: <span className="text-emerald-700">800 × 800 px</span> (ან ChatGPT-ის <span className="text-emerald-700">1024 × 1024 px</span>, 1:1 კვადრატი)
                        </p>
                        <p className="text-stone-600 mt-0.5 leading-relaxed">
                          მთავარ გვერდზე კატეგორია ჩანს კვადრატულ ბარათზე, ქვედა მხარეს წარწერით. სურათის არჩევისას გაიხსნება ჩარჩო, სადაც შეგიძლიათ სურათი მაუსით გაასწოროთ.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyGptPrompt}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-100/60 text-stone-800 border border-amber-300 rounded-lg font-semibold transition-colors"
                      title="დააკოპირეთ ტექსტი ChatGPT-სთვის მისაწერად"
                    >
                      {copiedGpt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">დაკოპირდა!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>GPT ზომა</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.image && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {/* Exact 1:1 Home Page Card Preview */}
                      <div className="relative w-44 h-44 aspect-square rounded-2xl overflow-hidden border border-gray-300 shadow-sm shrink-0 bg-stone-100">
                        <img
                          src={formData.image}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                          <span className="text-[10px] text-emerald-300 font-semibold block">საიტზე ჩანს ასე (1:1)</span>
                          <p className="text-sm font-bold text-white truncate">
                            {formData.name || "კატეგორიის სახელი"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              image: "",
                            }))
                          }
                          title="სურათის წაშლა"
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() =>
                            formData.image &&
                            setCropTarget({
                              src: formData.image,
                              fileName: `${formData.slug || "category"}.jpg`,
                            })
                          }
                          className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Crop className="w-4 h-4" />
                          სურათის მორგება / მოჭრა (Cropper)
                        </button>
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-3 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          სხვა სურათის არჩევა
                        </button>
                      </div>
                    </div>
                  )}

                  {!formData.image && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5"
                    >
                      {uploading ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          ატვირთვა...
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Upload className="w-4 h-4 text-blue-600" />
                            სურათის არჩევა და ჩარჩოში მორგება
                          </div>
                          <span className="text-xs text-gray-500">
                            800 × 800 px ან 1024 × 1024 px (1:1 კვადრატი)
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {uploading && formData.image && (
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium py-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ახალი ვერსია იტვირთება...
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
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

      {/* Facebook-style Image Cropper Modal for Categories */}
      {cropTarget && (
        <ImageCropperModal
          isOpen={true}
          imageSrc={cropTarget.src}
          fileName={cropTarget.fileName}
          aspect={1}
          outputWidth={800}
          outputHeight={800}
          title="კატეგორიის სურათის მორგება (1:1 კვადრატი)"
          subtitle="გადაადგილეთ სურათი ჩარჩოში ისე, რომ მთავარი ნივთი ცენტრში მოექცეს და წარწერამ არ დაფაროს"
          categoryPreviewTitle={formData.name || "კატეგორიის სახელი"}
          onClose={cleanupCropTarget}
          onCropComplete={uploadCategoryFile}
          onSkipCrop={
            cropTarget.file
              ? () => uploadCategoryFile(cropTarget.file!)
              : undefined
          }
        />
      )}
    </div>
  );
};

export default CategoryManager;
