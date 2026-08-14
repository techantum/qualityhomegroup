"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getArticles, type Article } from "@/lib/firestore";
import { Footer } from "@/components/footer";
import { Loader2, Menu, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";


const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/apartments", label: "Apartments" },
  { href: "/villas", label: "Villas" },
  { href: "/commercial", label: "Commercial" },
  { href: "/plots", label: "Plots" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function BlogDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const data = await getArticles();
        const foundPost = data.find((p) => p.id === params.id);
        if (foundPost) {
          setPost(foundPost);
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
  }, [params.id]);

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
        {/* White Navbar */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center py-4">
              <Link href="/">
                <Image
                  src="/images/quality-home-group-logo.png"
                  alt="Quality Home Group"
                  width={120}
                  height={50}
                  className="h-12 w-auto"
                />
              </Link>
            </div>
          </div>
        </header>
        <div className="py-32 text-center">
          <h1 className="text-2xl font-bold text-[#1F2A54] mb-4">Blog Post Not Found</h1>
          <Link href="/blog" className="text-[#DDA21A] hover:underline">
            Return to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* White Navbar - Matching Home Page */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          {/* Desktop Layout */}
          <div className="hidden lg:flex flex-col items-center">
            {/* Logo - Centered */}
            <div className="pt-4 pb-2">
              <Link href="/">
                <Image
                  src="/images/quality-home-group-logo.png"
                  alt="Quality Home Group"
                  width={120}
                  height={50}
                  className="h-12 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Row */}
            <div className="w-full flex items-center justify-center pb-4">
              <nav className="flex items-center justify-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      link.href === "/blog"
                        ? "text-[#DDA21A]"
                        : "text-[#1F2A54] hover:text-[#DDA21A]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button className="font-medium px-6 py-2 rounded-md bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white ml-4">
                  Enquiry Now
                </Button>
              </nav>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="flex items-center justify-center py-4 relative">
              <Link href="/">
                <Image
                  src="/images/quality-home-group-logo.png"
                  alt="Quality Home Group"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>

              <button
                type="button"
                className="absolute right-0 p-2 text-[#1F2A54]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="pb-4 bg-white">
                <nav className="flex flex-col items-center gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-sm transition-colors text-center ${
                        link.href === "/blog"
                          ? "text-[#DDA21A]"
                          : "text-[#1F2A54] hover:text-[#DDA21A]"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Button className="font-medium mt-2 bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white">
                    Enquiry Now
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner Image - Full Width */}
      <section className="relative h-[300px] w-full overflow-hidden">
        <Image
          src={post.image || "/images/blog-details-banner.png"}
          alt={post.title}
          fill
          className="object-cover object-center"
          priority
        />
      </section>

      {/* Blog Content */}
      <section className="py-12">
        <div className="max-w-[750px] mx-auto px-4">
          {/* Title - Gold color as per reference */}
          <h1 className="text-[#DDA21A] text-xl md:text-2xl lg:text-[28px] font-bold mb-2 leading-tight">
            {post.title}
          </h1>

          {/* Date - Bold black as per reference */}
          <p className="text-[#1F2A54] text-sm font-bold mb-8">
            {post.date}
          </p>

          {/* Content - Justified text with proper spacing */}
          <article className="max-w-none">
            {post.content ? (
              <div className="space-y-5">
                {post.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={idx} className="text-[#1F2A54] font-bold text-base mt-6 mb-2">
                        {paragraph.replace(/\*\*/g, '')}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
