"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowLeft, Share2, Heart, Eye } from "lucide-react";

interface Article {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    email?: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  readTime: number;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content/slug/${slug}`);
      const data = await res.json();
      
      if (data.success) {
        setArticle(data.data);
        fetchRelatedArticles(data.data.category, data.data._id);
      }
    } catch (error) {
      console.error("Failed to fetch article", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async (category: string, excludeId: string) => {
    try {
      const params = new URLSearchParams();
      params.append("type", "ARTICLE");
      params.append("status", "PUBLISHED");
      params.append("category", category);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content?${params}`);
      const data = await res.json();
      
      if (data.success) {
        const related = data.data.content
          .filter((a: Article) => a._id !== excludeId)
          .slice(0, 3);
        setRelatedArticles(related);
      }
    } catch (error) {
      console.error("Failed to fetch related articles", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h1>
          <Link href="/blog" className="text-blue-600 hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="container py-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </section>

      {/* Article Header */}
      <section className="bg-white pt-8 pb-12">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                {article.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views?.toLocaleString()} views
              </span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-xl text-slate-600 mb-6">
                {article.subtitle}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center justify-between py-6 border-y border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{article.author?.name}</p>
                  <p className="text-sm text-slate-500">
                    {article.author?.bio || "Healthcare Expert"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      {article.featuredImage && (
        <section className="bg-white pb-12">
          <div className="container max-w-5xl">
            <div className="rounded-2xl overflow-hidden">
              <img 
                src={article.featuredImage} 
                alt={article.title}
                className="w-full h-64 lg:h-96 object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-8 lg:p-12"
          >
            <div 
              className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-blue-600 prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link key={related._id} href={`/blog/${related.slug}`}>
                  <div className="group">
                    <div className="h-40 bg-slate-200 rounded-xl mb-4 overflow-hidden">
                      {related.featuredImage ? (
                        <img 
                          src={related.featuredImage} 
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">
                      {new Date(related.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
