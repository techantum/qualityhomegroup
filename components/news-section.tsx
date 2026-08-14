"use client";

import { useState, useEffect } from "react";
import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

interface ArticleDisplay {
  id: string;
  category: string;
  date: string;
  title: string;
  image: string;
}

function formatDate(val: unknown): string {
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (val && typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  return "";
}

export function NewsSection() {
  const [articles, setArticles] = useState<ArticleDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch("/api/v1/articles/public?limit=8");
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data) ? json.data : [];
        const mapped: ArticleDisplay[] = list.map((a: Record<string, unknown>) => ({
          id: String(a?.id ?? Math.random()),
          category: String(a?.category ?? ""),
          date: formatDate(a?.date ?? a?.createdAt ?? ""),
          title: String(a?.title ?? ""),
          image: String(a?.image ?? ""),
        }));
        setArticles(mapped);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Section Header */}
        <Reveal className="text-center mb-12">
          <h2 className="font-extrabold text-3xl md:text-4xl text-[#1F2A54] mb-3">
            Recent Articles & News
          </h2>
          <p className="text-gray-500">
            Stay updated with the latest news and insights from the real estate world.
          </p>
        </Reveal>

        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse mx-auto" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No articles available yet.</p>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && articles.length > 0 && (
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <StaggerItem key={article.id}>
              <motion.article 
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(31,42,84,0.12)" }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative img-hover-zoom">
                  <SafeImage
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500"
                  />
                </div>
                
                {/* Content */}
                <div className="p-4 text-center">
                  {/* Meta */}
                  <div className="flex items-center justify-center gap-2 text-sm mb-2">
                    <span className="text-red-500 font-medium">{article.category}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{article.date}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold text-[#1F2A54] leading-tight mb-4 text-balance group-hover:text-[#DDA21A] transition-colors">
                    {article.title}
                  </h3>
                  
                  {/* Read More */}
                  <Link 
                    href={`/blog/${article.id}`}
                    className="inline-flex items-center text-sm text-[#1F2A54] hover:text-[#DDA21A] transition-colors link-hover-slide cursor-pointer"
                  >
                    Read More <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
