import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  ExternalLink,
  Clock,
  Calendar,
  Tag,
  Copy,
} from "lucide-react";
import { BlogService, BlogPost } from "../../../services/blogService";

type BlogPostInput = Omit<BlogPost, "id" | "createdAt" | "updatedAt">;
import { generateProductSlug } from "../../../utils/slug";
import RichTextEditor from "../../../components/ui/RichTextEditor";
import ImageUpload from "../../../components/ui/ImageUpload";

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  titleEn: "",
  excerptEn: "",
  contentEn: "",
  titleRu: "",
  excerptRu: "",
  contentRu: "",
  image: "",
  tags: "",
  readTime: 3,
  isPublished: false,
};

type FormState = typeof EMPTY_FORM;
type LangTab = "ka" | "en" | "ru";

const LANG_TABS: { key: LangTab; label: string; flag: string; required: boolean }[] = [
  { key: "ka", label: "ქართული", flag: "🇬🇪", required: true },
  { key: "en", label: "English",  flag: "🇬🇧", required: false },
  { key: "ru", label: "Русский",  flag: "🇷🇺", required: false },
];

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugLocked, setSlugLocked] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<LangTab>("ka");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await BlogService.getAllPosts();
      setPosts(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugLocked(false);
    setActiveLangTab("ka");
    setIsDrawerOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      titleEn: post.titleEn || "",
      excerptEn: post.excerptEn || "",
      contentEn: post.contentEn || "",
      titleRu: post.titleRu || "",
      excerptRu: post.excerptRu || "",
      contentRu: post.contentRu || "",
      image: post.image || "",
      tags: post.tags.join(", "),
      readTime: post.readTime,
      isPublished: post.isPublished,
    });
    setSlugLocked(true);
    setActiveLangTab("ka");
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugLocked ? f.slug : generateProductSlug(title),
    }));
  };

  const copyKaStructure = (target: "en" | "ru") => {
    if (!form.content.trim()) return;
    const confirmed = window.confirm(
      target === "en"
        ? "ქართული კონტენტი გადაკოპირდება EN editor-ში. გსურს?"
        : "ქართული კონტენტი გადაკოპირდება RU editor-ში. გსურს?"
    );
    if (!confirmed) return;
    if (target === "en") setForm((f) => ({ ...f, contentEn: f.content }));
    else setForm((f) => ({ ...f, contentRu: f.content }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      alert("სათაური, სლაგი და ტექსტი სავალდებულოა");
      return;
    }
    setSaving(true);
    try {
      const base: BlogPostInput = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim().slice(0, 155),
        content: form.content.trim(),
        image: form.image.trim() || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: Math.max(1, Number(form.readTime) || 1),
        isPublished: form.isPublished,
        publishedAt: new Date(),
      };
      if (form.titleEn.trim()) base.titleEn = form.titleEn.trim();
      if (form.excerptEn.trim()) base.excerptEn = form.excerptEn.trim().slice(0, 155);
      if (form.contentEn.trim()) base.contentEn = form.contentEn.trim();
      if (form.titleRu.trim()) base.titleRu = form.titleRu.trim();
      if (form.excerptRu.trim()) base.excerptRu = form.excerptRu.trim().slice(0, 155);
      if (form.contentRu.trim()) base.contentRu = form.contentRu.trim();
      if (editingId) {
        await BlogService.updatePost(editingId, base);
      } else {
        await BlogService.createPost(base);
      }
      await load();
      closeDrawer();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`წაშლა: "${title}"?`)) return;
    setDeleting(id);
    try {
      await BlogService.deletePost(id);
      await load();
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    await BlogService.updatePost(post.id, {
      isPublished: !post.isPublished,
      publishedAt: !post.isPublished ? new Date() : post.publishedAt,
    });
    await load();
  };

  const hasTranslation = (lang: "en" | "ru") =>
    lang === "en"
      ? !!(form.titleEn || form.contentEn)
      : !!(form.titleRu || form.contentRu);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ბლოგი</h2>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} სტატია</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          ახალი სტატია
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
          <p className="text-lg font-medium mb-2">სტატიები არ არის</p>
          <p className="text-sm">დაამატე პირველი სტატია</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
            >
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {post.titleEn && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">EN</span>}
                    {post.titleRu && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">RU</span>}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        post.isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {post.isPublished ? "გამოქვეყნებული" : "დრაფტი"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.publishedAt.toLocaleDateString("ka-GE")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime} წთ
                  </span>
                  {post.tags.slice(0, 3).map((t) => (
                    <span key={t} className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {post.isPublished && (
                  <a
                    href={`https://lifestore.ge/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleTogglePublish(post)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {post.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(post)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  disabled={deleting === post.id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? "სტატიის რედაქტირება" : "ახალი სტატია"}
              </h3>
              <button onClick={closeDrawer} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Slug — language-agnostic, always visible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  სლაგი (URL) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-400 select-none">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setForm((f) => ({
                        ...f,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
                      }));
                    }}
                    className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Language tabs */}
              <div>
                <div className="flex border-b border-gray-200 mb-5">
                  {LANG_TABS.map((tab) => {
                    const hasTrans = tab.key !== "ka" && hasTranslation(tab.key as "en" | "ru");
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveLangTab(tab.key)}
                        className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                          activeLangTab === tab.key
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span>{tab.flag}</span>
                        <span>{tab.label}</span>
                        {tab.required && <span className="text-red-500">*</span>}
                        {hasTrans && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Georgian tab ── */}
                {activeLangTab === "ka" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        სათაური <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="სტატიის სათაური"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        მოკლე აღწერა{" "}
                        <span className="text-gray-400 font-normal">({form.excerpt.length}/155, SEO)</span>
                      </label>
                      <textarea
                        value={form.excerpt}
                        onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value.slice(0, 155) }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="სტატიის მოკლე შინაარსი (გამოჩნდება Google-ში)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ტექსტი <span className="text-red-500">*</span>
                      </label>
                      <RichTextEditor
                        value={form.content}
                        onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                        placeholder="სტატიის ტექსტი — H2, H3, Bold, სია..."
                      />
                    </div>
                  </div>
                )}

                {/* ── English tab ── */}
                {activeLangTab === "en" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">EN ველები არასავალდებულოა. შევსების შემდეგ სტატია ინგლისურად გამოჩნდება.</p>
                      <button
                        type="button"
                        onClick={() => copyKaStructure("en")}
                        disabled={!form.content.trim()}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        KA სტრუქტურის კოპირება
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                      <input
                        type="text"
                        value={form.titleEn}
                        onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Article title in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Excerpt (EN) <span className="text-gray-400 font-normal">({form.excerptEn.length}/155, SEO)</span>
                      </label>
                      <textarea
                        value={form.excerptEn}
                        onChange={(e) => setForm((f) => ({ ...f, excerptEn: e.target.value.slice(0, 155) }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        placeholder="Short excerpt in English (SEO, max 155 chars)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content (EN)</label>
                      <RichTextEditor
                        value={form.contentEn}
                        onChange={(html) => setForm((f) => ({ ...f, contentEn: html }))}
                        placeholder="Full article in English — translate from the Georgian tab..."
                      />
                    </div>
                  </div>
                )}

                {/* ── Russian tab ── */}
                {activeLangTab === "ru" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">RU ველები არასავალდებულოა. შევსების შემდეგ სტატია რუსულად გამოჩნდება.</p>
                      <button
                        type="button"
                        onClick={() => copyKaStructure("ru")}
                        disabled={!form.content.trim()}
                        className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        KA სტრუქტურის კოპირება
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок (RU)</label>
                      <input
                        type="text"
                        value={form.titleRu}
                        onChange={(e) => setForm((f) => ({ ...f, titleRu: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Заголовок статьи на русском"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Краткое описание (RU) <span className="text-gray-400 font-normal">({form.excerptRu.length}/155, SEO)</span>
                      </label>
                      <textarea
                        value={form.excerptRu}
                        onChange={(e) => setForm((f) => ({ ...f, excerptRu: e.target.value.slice(0, 155) }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                        placeholder="Краткое описание на русском (SEO, макс. 155 символов)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Контент (RU)</label>
                      <RichTextEditor
                        value={form.contentRu}
                        onChange={(html) => setForm((f) => ({ ...f, contentRu: html }))}
                        placeholder="Полный текст статьи на русском — переведите с грузинской вкладки..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image — language-agnostic */}
              <ImageUpload
                images={form.image ? [form.image] : []}
                onChange={(urls) => setForm((f) => ({ ...f, image: urls[0] || "" }))}
                maxImages={1}
              />

              {/* Tags + Read time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ტეგები</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ეკო, სახლი, ..."
                  />
                  <p className="text-xs text-gray-400 mt-1">მძიმით გამოყოფილი</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">კითხვის დრო (წთ)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.readTime}
                    onChange={(e) => setForm((f) => ({ ...f, readTime: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">გამოქვეყნება</p>
                  <p className="text-xs text-gray-400">
                    {form.isPublished ? "სტატია ხილულია ყველასთვის" : "სტატია დამალულია (დრაფტი)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPublished ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.isPublished ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              <button
                onClick={closeDrawer}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "ინახება..." : "შენახვა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
