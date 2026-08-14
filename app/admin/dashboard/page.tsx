"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, getLeads, getProjects, getArticles, type Lead, type Project, type Article } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
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
  ChevronRight,
  ChevronDown,
  Loader2,
  Users,
  ImageIcon,
  BarChart3,
  Home,
  Layers,
  Search,
  FormInput,
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { 
    icon: Layers, 
    label: "Pages", 
    children: [
      { label: "Home", href: "/admin/dashboard/cms/home" },
      { label: "About", href: "/admin/dashboard/cms/about" },
      { label: "Apartments", href: "/admin/dashboard/cms/apartments" },
      { label: "Villas", href: "/admin/dashboard/cms/villas" },
      { label: "Commercial", href: "/admin/dashboard/cms/commercial" },
      { label: "Plots", href: "/admin/dashboard/cms/plots" },
      { label: "Contact", href: "/admin/dashboard/cms/contact" },
    ]
  },
  { icon: Users, label: "Leads (CRM)", href: "/admin/dashboard/leads" },
  { icon: FolderOpen, label: "Projects", href: "/admin/dashboard/projects" },
  { icon: ImageIcon, label: "Media Library", href: "/admin/dashboard/gallery" },
  { icon: Newspaper, label: "Blog", href: "/admin/dashboard/blog" },
  { icon: MessageSquare, label: "Testimonials", href: "/admin/dashboard/testimonials" },
  { icon: FormInput, label: "Forms", href: "/admin/dashboard/forms" },
  { icon: Search, label: "SEO Manager", href: "/admin/dashboard/seo" },
  { icon: BarChart3, label: "Analytics", href: "/admin/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/dashboard/settings" },
];

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["CMS"]);
  const [stats, setStats] = useState({
    projects: 0,
    testimonials: 0,
    articles: 0,
    leads: 0,
    gallery: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, leads, projects, articles] = await Promise.all([
          getDashboardStats(),
          getLeads(),
          getProjects(),
          getArticles(),
        ]);
        setStats(statsData);
        setRecentLeads(leads.slice(0, 5));
        setRecentProjects(projects.slice(0, 5));
        setRecentArticles(articles.slice(0, 5));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setStats({
          projects: 0,
          testimonials: 0,
          articles: 0,
          leads: 0,
          gallery: 0,
        });
        setRecentLeads([]);
        setRecentProjects([]);
        setRecentArticles([]);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statCards = [
    { label: "Total Projects", value: stats.projects, icon: FolderOpen, color: "bg-blue-500" },
    { label: "Total Leads", value: stats.leads, icon: Users, color: "bg-green-500" },
    { label: "Blog Posts", value: stats.articles, icon: Newspaper, color: "bg-purple-500" },
    { label: "Gallery Images", value: stats.gallery, icon: ImageIcon, color: "bg-gold" },
  ];

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
            <Image src="/images/quality-home-group-logo-footer.png" alt="Quality Home Group" width={100} height={40} className="h-10 w-auto brightness-0 invert" />
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
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-white/10"
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
                            pathname === child.href
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
                    pathname === item.href
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
              <h1 className="text-xl font-semibold text-[#1F2A54]">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user.email}
              </span>
              <div className="h-8 w-8 rounded-full bg-[#1F2A54] text-white flex items-center justify-center text-sm font-medium">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold text-[#1F2A54]">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          <stat.icon size={24} className="text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Recent Leads */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Leads</CardTitle>
                      <CardDescription>Latest enquiries from visitors</CardDescription>
                    </div>
                    <Link href="/admin/dashboard/leads">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentLeads.length > 0 ? (
                      <div className="space-y-3">
                        {recentLeads.map((lead) => (
                          <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium text-[#1F2A54]">{lead.name}</p>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'new' ? 'bg-green-100 text-green-700' :
                              lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                              lead.status === 'qualified' ? 'bg-purple-100 text-purple-700' :
                              lead.status === 'converted' ? 'bg-gold/20 text-gold' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No leads yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Projects */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Projects</CardTitle>
                      <CardDescription>Latest added projects</CardDescription>
                    </div>
                    <Link href="/admin/dashboard/projects">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentProjects.length > 0 ? (
                      <div className="space-y-3">
                        {recentProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            {project.image && (
                              <Image 
                                src={project.image || "/placeholder.svg"} 
                                alt={project.title}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-[#1F2A54]">{project.title}</p>
                              <p className="text-sm text-muted-foreground">{project.type} - {project.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No projects yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Articles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks you can perform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Add New Project", href: "/admin/dashboard/projects", icon: FolderOpen },
                      { label: "Manage Gallery", href: "/admin/dashboard/gallery", icon: ImageIcon },
                      { label: "Write Blog Post", href: "/admin/dashboard/blog", icon: Newspaper },
                      { label: "View Leads", href: "/admin/dashboard/leads", icon: Users },
                      { label: "Update Home Page", href: "/admin/dashboard/cms/home", icon: Home },
                    ].map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <action.icon size={18} className="text-[#1F2A54]" />
                          <span>{action.label}</span>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Blog Posts</CardTitle>
                      <CardDescription>Latest published articles</CardDescription>
                    </div>
                    <Link href="/admin/dashboard/blog">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentArticles.length > 0 ? (
                      <div className="space-y-3">
                        {recentArticles.map((article) => (
                          <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            {article.image && (
                              <Image 
                                src={article.image || "/placeholder.svg"} 
                                alt={article.title}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1F2A54] truncate">{article.title}</p>
                              <p className="text-sm text-muted-foreground">{article.category} - {article.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No articles yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
