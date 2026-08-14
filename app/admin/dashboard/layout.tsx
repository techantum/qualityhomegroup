"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Newspaper,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
  Users,
  ImageIcon,
  BarChart3,
  Layers,
  Search,
  FormInput,
  Globe,
  Tags,
} from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import { isValidImageUrl } from "@/lib/media";

interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const DEFAULT_CATEGORY_PAGES = [
  { label: "Apartments", slug: "apartments" },
  { label: "Villas", slug: "villas" },
  { label: "Commercial", slug: "commercial" },
  { label: "Plots", slug: "plots" },
];

function buildMenuItems(categories: SidebarCategory[]): MenuItem[] {
  // Merge fetched categories with defaults so the 4 core pages always appear
  const slugsSeen = new Set(categories.map((c) => c.slug));
  const categoryEntries = [
    ...categories.map((c) => ({ label: c.name, href: `/admin/dashboard/cms/${c.slug}` })),
    ...DEFAULT_CATEGORY_PAGES.filter((d) => !slugsSeen.has(d.slug)).map((d) => ({
      label: d.label,
      href: `/admin/dashboard/cms/${d.slug}`,
    })),
  ];

  const pageChildren = [
    { label: "Home", href: "/admin/dashboard/cms/home" },
    { label: "About", href: "/admin/dashboard/cms/about" },
    ...categoryEntries,
    { label: "Gallery", href: "/admin/dashboard/gallery" },
    { label: "Blog", href: "/admin/dashboard/blog" },
    { label: "Contact", href: "/admin/dashboard/cms/contact" },
    { label: "Testimonials", href: "/admin/dashboard/testimonials" },
  ];

  return [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Layers, label: "Pages", children: pageChildren },
    { icon: Users, label: "Leads (CRM)", href: "/admin/dashboard/leads" },
    { icon: FolderOpen, label: "Projects", href: "/admin/dashboard/projects" },
    { icon: Tags, label: "Categories", href: "/admin/dashboard/categories" },
    { icon: Search, label: "SEO Manager", href: "/admin/dashboard/seo" },
    { icon: BarChart3, label: "Analytics", href: "/admin/dashboard/analytics" },
    { icon: Settings, label: "Settings", href: "/admin/dashboard/settings" },
  ];
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Pages"]);
  const [categories, setCategories] = useState<SidebarCategory[]>([]);
  const { branding } = useBranding();

  // Fetch categories via API (uses Admin SDK server-side) to avoid Firestore client permission errors
  useEffect(() => {
    if (!user || typeof user.getIdToken !== "function") return;
    async function fetchCategories() {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/v1/categories", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data ?? []);
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.warn("Categories API returned", res.status, errBody?.error ?? errBody);
        }
      } catch (error) {
        console.error("Error fetching categories for sidebar:", error);
      }
    }
    fetchCategories();
  }, [user]);

  const menuItems = buildMenuItems(categories);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children: { href: string }[]) => 
    children.some(child => pathname === child.href);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // For the main dashboard page, render children directly (it has its own layout)
  if (pathname === "/admin/dashboard") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#1F2A54] text-white transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="block max-w-[140px]">
              {isValidImageUrl(branding.logoFooter) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoFooter}
                  alt={branding.siteName}
                  className="h-10 w-auto max-w-[140px] object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-sm font-semibold leading-tight text-white">
                  {branding.siteName}
                </span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-white/10 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                      isChildActive(item.children) ? "bg-white/10" : "hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${expandedMenus.includes(item.label) ? "rotate-180" : ""}`} 
                    />
                  </button>
                  {expandedMenus.includes(item.label) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                            isActive(child.href)
                              ? "bg-gold text-[#1F2A54] font-medium"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href!)
                      ? "bg-gold text-[#1F2A54] font-medium"
                      : "hover:bg-white/10"
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Sign Out - Fixed at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#1F2A54]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-red-300"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-secondary rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-[#1F2A54] capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <div className="h-8 w-8 rounded-full bg-[#1F2A54] text-white flex items-center justify-center text-sm font-medium">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
