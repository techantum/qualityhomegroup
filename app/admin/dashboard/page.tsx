"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import { type Lead, type Project, type Article } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  FolderOpen,
  Newspaper,
  ChevronRight,
  Loader2,
  Users,
  ImageIcon,
  Home,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
      if (!user) return;
      try {
        const [statsRes, leadsRes, projectsRes, articlesRes] = await Promise.all([
          adminApiFetch(user, "/api/v1/dashboard/stats"),
          adminApiFetch(user, "/api/v1/leads?limit=5"),
          adminApiFetch(user, "/api/v1/projects"),
          adminApiFetch(user, "/api/v1/articles"),
        ]);
        const [statsJson, leadsJson, projectsJson, articlesJson] = await Promise.all([
          statsRes.json().catch(() => ({})),
          leadsRes.json().catch(() => ({})),
          projectsRes.json().catch(() => ({})),
          articlesRes.json().catch(() => ({})),
        ]);
        if (statsRes.ok && statsJson?.data) {
          setStats({
            projects: statsJson.data.projects ?? 0,
            testimonials: statsJson.data.testimonials ?? 0,
            articles: statsJson.data.articles ?? 0,
            leads: statsJson.data.leads ?? 0,
            gallery: statsJson.data.gallery ?? 0,
          });
        }
        setRecentLeads(((leadsJson.data ?? []) as Lead[]).slice(0, 5));
        setRecentProjects(((projectsJson.data ?? []) as Project[]).slice(0, 5));
        setRecentArticles(((articlesJson.data ?? []) as Article[]).slice(0, 5));
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

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
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
    <div className="p-4 md:p-6 overflow-x-hidden">
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      <div key={lead.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-[#1F2A54] truncate">{lead.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === "new" ? "bg-green-100 text-green-700" :
                          lead.status === "contacted" ? "bg-blue-100 text-blue-700" :
                          lead.status === "qualified" ? "bg-purple-100 text-purple-700" :
                          lead.status === "converted" ? "bg-gold/20 text-gold" :
                          "bg-red-100 text-red-700"
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

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg border min-w-0">
                        {project.image && (
                          <Image
                            src={project.image || "/placeholder.svg"}
                            alt={project.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#1F2A54] truncate">{project.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{project.type} - {project.location}</p>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
    </div>
  );
}
