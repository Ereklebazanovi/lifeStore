import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import { BlogService, BlogPost } from "../services/blogService";
import { useTranslation } from "react-i18next";
import {
  getLocalizedBlogTitle,
  getLocalizedBlogExcerpt,
  getLocalizedBlogTag,
} from "../utils/i18nHelpers";

const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    BlogService.getPublishedPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const filtered = activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone-100 rounded-2xl h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-20">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-3">
          {t("blog.title")}
        </h1>
        <p className="text-stone-500 text-lg">{t("blog.subtitle")}</p>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTag === null
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t("home.filterAll")}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {getLocalizedBlogTag(tag, t)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg">{t("blog.noPosts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <BlogCard key={post.id} post={post} lang={i18n.language} />
          ))}
        </div>
      )}
    </div>
  );
};

const BlogCard: React.FC<{ post: BlogPost; lang: string }> = ({ post, lang }) => {
  const { t } = useTranslation();
  const title = getLocalizedBlogTitle(post, lang);
  const excerpt = getLocalizedBlogExcerpt(post, lang);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all duration-200"
    >
      {post.image ? (
        <div className="aspect-video overflow-hidden bg-stone-100">
          <img
            src={post.image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-linear-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
          <span className="text-4xl">🌿</span>
        </div>
      )}
      <div className="flex flex-col flex-1 p-5">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {getLocalizedBlogTag(tag, t)}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-base font-bold text-stone-800 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {title}
        </h2>
        <p className="text-sm text-stone-500 line-clamp-3 mb-4 flex-1">{excerpt}</p>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {post.publishedAt.toLocaleDateString("ka-GE")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} {t("blog.readTime")}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default BlogPage;
