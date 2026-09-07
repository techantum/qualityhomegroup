"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/firestore";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListingHero } from "@/components/listing-hero";
import { SafeImage } from "@/components/safe-image";
import { usePageContent } from "@/hooks/use-page-content";
import { ChevronRight, Loader2 } from "lucide-react";

export default function BlogPage() {
  const [posts, setPosts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: pageContent, loading: pageLoading } = usePageContent("blog");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/v1/articles/public", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        setPosts(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Header */}
      <Header />

      <ListingHero
        title={(pageContent?.heroTitle as string) || pageContent?.title}
        image={pageContent?.heroImage}
        loading={pageLoading}
        defaultAlt="Blog"
      />

      {/* Blog Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Decorative U Pattern Background */}

        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          {/* Section Header */}
          {(String(pageContent?.subtitle || "").trim() || String(pageContent?.content || "").trim()) && (
          <div className="text-center mb-12">
            {String(pageContent?.subtitle || "").trim() && (
              <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1F2A54] mb-2">
                {String(pageContent?.subtitle).trim()}
              </h2>
            )}
            {String(pageContent?.content || "").trim() && (
              <p className="text-[#DDA21A] text-lg tracking-wider">
                {String(pageContent?.content).trim()}
              </p>
            )}
          </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#DDA21A]" />
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.map((post, index) => (
                <article key={`${post.id}-${index}`} className="group">
                  {/* Clickable Image */}
                  <Link href={`/blog/${post.id}`} className="block">
                    <div className="relative mb-4 aspect-square cursor-pointer overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(31,42,84,0.22)]">
                      <SafeImage
                        src={post.image}
                        hideIfEmpty
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div>
                    <h3 className="text-[#1F2A54] font-semibold text-base mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#DDA21A] text-xs mb-2">{post.date}</p>
                    <p className="text-[#666666] text-sm mb-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center gap-2 text-[#1F2A54] font-medium text-sm hover:text-[#DDA21A] transition-colors"
                    >
                      Read More
                      <ChevronRight className="w-4 h-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
