"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, User, Search, Tag } from "lucide-react";

interface Article {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: number;
  views: number;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("type", "ARTICLE");
      params.append("status", "PUBLISHED");
      if (selectedCategory) params.append("category", selectedCategory);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content?${params}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data?.content)) {
        setArticles(data.data.content);
        // Extract unique categories with proper type assertion
        const categories: string[] = data.data.content
          .map((a: Article) => a.category)
          .filter((cat: unknown): cat is string => typeof cat === 'string');
        const cats = [...new Set(categories)];
        setCategories(cats);
      } else {
        console.error("Invalid data format received");
        setArticles([]);
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      setArticles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredArticles[0];
  const regularArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-4 block">
              Health Insights
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Health Articles & Resources
            </h1>
            <p className="text-slate-600 text-lg">
              Stay informed with the latest health tips, medical insights, and wellness advice from our expert healthcare professionals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="loader"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No articles found</p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredArticle && !searchQuery && !selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <Link href={`/blog/${featuredArticle.slug}`}>
                    <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
                      <div className="grid lg:grid-cols-2">
                        <div className="h-64 lg:h-auto bg-slate-200 relative">
                          {featuredArticle.featuredImage ? (
                            <img 
                              src={featuredArticle.featuredImage} 
                              alt={featuredArticle.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                              <span className="text-6xl">📝</span>
                            </div>
                          )}
                          <span className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Featured
                          </span>
                        </div>
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                              {featuredArticle.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(featuredArticle.publishedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {featuredArticle.readTime} min read
                            </span>
                          </div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                            {featuredArticle.title}
                          </h2>
                          <p className="text-slate-600 text-lg mb-6 line-clamp-3">
                            {featuredArticle.excerpt}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{featuredArticle.author?.name}</p>
                              <p className="text-sm text-slate-500">Healthcare Expert</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Articles Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularArticles.map((article, index) => (
                  <motion.article
                    key={article._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ArticleCard article={article} />
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
        <div className="h-48 bg-slate-200 relative overflow-hidden">
          {article.featuredImage ? (
            <img 
              src={article.featuredImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-4xl">🩺</span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
            {article.category}
          </span>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(article.publishedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime} min
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>
          
          <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {article.author?.name}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}
