"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Article } from "@/lib/firestore";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SafeImage } from "@/components/safe-image";
import { Loader2, ArrowLeft } from "lucide-react";

export default function BlogDetailPage() {
  const params = useParams();
  const articleId = String(params.id ?? "");
  const [post, setPost] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!articleId) {
        setPost(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/v1/articles/public/${encodeURIComponent(articleId)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setPost(json.data as Article);
        } else {
          setPost(null);
        }
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA21A]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <div className="py-32 text-center">
          <h1 className="text-2xl font-bold text-[#1F2A54] mb-4">Blog Post Not Found</h1>
          <Link href="/blog" className="text-[#DDA21A] hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Header />

      <section className="relative h-[300px] w-full overflow-hidden">
        <SafeImage
          src={post.image}
          alt={post.title}
          fill
          className="object-cover object-center"
          priority
        />
      </section>

      <section className="py-12">
        <div className="max-w-[750px] mx-auto px-4">
          <h1 className="text-[#DDA21A] text-xl md:text-2xl lg:text-[28px] font-bold mb-2 leading-tight">
            {post.title}
          </h1>

          <p className="text-[#1F2A54] text-sm font-bold mb-8">{post.date}</p>

          <article className="max-w-none">
            {post.content ? (
              <div className="space-y-5">
                {post.content.split("\n\n").map((paragraph, idx) => {
                  if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                    return (
                      <h3 key={idx} className="text-[#1F2A54] font-bold text-base mt-6 mb-2">
                        {paragraph.replace(/\*\*/g, "")}
                      </h3>
                    );
                  }
                  return (
                    <p key={idx} className="text-[#666666] text-sm leading-[1.8] text-justify">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="text-[#666666] text-sm leading-[1.8] text-justify">{post.excerpt}</p>
            )}
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}
