import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Tag, ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { BlogService, BlogPost } from "../services/blogService";
import { useTranslation } from "react-i18next";
import {
  getLocalizedBlogTitle,
  getLocalizedBlogExcerpt,
  getLocalizedBlogContent,
  getLocalizedBlogTag,
} from "../utils/i18nHelpers";

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      BlogService.getPostBySlug(slug),
      BlogService.getPublishedPosts(10),
    ]).then(([found, allPosts]) => {
      if (!found || !found.isPublished) {
        navigate("/blog", { replace: true });
        return;
      }
      setPost(found);

      const others = allPosts.filter((p) => p.id !== found.id);
      const withTag = others.filter((p) =>
        p.tags.some((t) => found.tags.includes(t))
      );
      const withoutTag = others.filter(
        (p) => !p.tags.some((t) => found.tags.includes(t))
      );
      setRelated([...withTag, ...withoutTag].slice(0, 3));
    }).finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-2/3" />
        <div className="h-64 bg-stone-100 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-stone-100 rounded" />)}
        </div>
      </div>
    );
  }

  if (!post) return null;

  const lang = i18n.language;
  const title = getLocalizedBlogTitle(post, lang);
  const content = getLocalizedBlogContent(post, lang);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-20">
      {/* Back link */}
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("nav.blog")}
      </Link>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full"
            >
              <Tag className="w-3 h-3" />
              {getLocalizedBlogTag(tag, t)}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 mb-4 leading-tight">
        {title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-stone-400 mb-8 pb-6 border-b border-stone-100">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {post.publishedAt.toLocaleDateString("ka-GE")}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {post.readTime} {t("blog.readTime")}
        </span>
      </div>

      {/* Cover image */}
      {post.image && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-stone-100">
          <img
            src={post.image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article
        className="blog-content max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* CTA */}
      <div className="bg-linear-to-br from-emerald-50 to-stone-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 mb-12 text-center">
        <p className="text-stone-600 mb-4 text-sm sm:text-base">
          {t("blog.ctaText")}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {t("home.hero.shopNow")}
        </Link>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-5">
            {t("product.discoverAlso")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => {
              const relatedTitle = getLocalizedBlogTitle(r, lang);
              return (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-sm hover:border-emerald-200 transition-all"
                >
                  {r.image ? (
                    <div className="aspect-video overflow-hidden bg-stone-100">
                      <img
                        src={r.image}
                        alt={relatedTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-linear-to-br from-emerald-50 to-stone-100 flex items-center justify-center text-2xl">
                      🌿
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 group-hover:text-emerald-700 transition-colors mb-2">
                      {relatedTitle}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <ArrowRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                      {t("blog.readMore")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPostPage;
