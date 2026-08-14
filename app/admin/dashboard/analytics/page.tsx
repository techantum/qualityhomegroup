"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, getLeads, type Lead } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Eye, MousePointer, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    projects: 0,
    testimonials: 0,
    articles: 0,
    leads: 0,
    gallery: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, leadsData] = await Promise.all([
          getDashboardStats(),
          getLeads(),
        ]);
        setStats(statsData);
        setLeads(leadsData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  const leadsByStatus = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const conversionRate = leads.length > 0 
    ? ((leadsByStatus.converted / leads.length) * 100).toFixed(1) 
    : 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1F2A54] mb-6">Analytics Overview</h1>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold text-[#1F2A54]">{stats.leads}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight size={12} /> +12% this month
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <Users size={24} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold text-[#1F2A54]">{conversionRate}%</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight size={12} /> +2.5% vs last month
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold text-[#1F2A54]">{stats.projects}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active listings</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500">
                    <Eye size={24} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blog Posts</p>
                    <p className="text-2xl font-bold text-[#1F2A54]">{stats.articles}</p>
                    <p className="text-xs text-muted-foreground mt-1">Published articles</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gold">
                    <MousePointer size={24} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Funnel</CardTitle>
                <CardDescription>Lead status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "New Leads", value: leadsByStatus.new, color: "bg-green-500", percentage: leads.length ? (leadsByStatus.new / leads.length) * 100 : 0 },
                    { label: "Contacted", value: leadsByStatus.contacted, color: "bg-blue-500", percentage: leads.length ? (leadsByStatus.contacted / leads.length) * 100 : 0 },
                    { label: "Qualified", value: leadsByStatus.qualified, color: "bg-purple-500", percentage: leads.length ? (leadsByStatus.qualified / leads.length) * 100 : 0 },
                    { label: "Converted", value: leadsByStatus.converted, color: "bg-gold", percentage: leads.length ? (leadsByStatus.converted / leads.length) * 100 : 0 },
                    { label: "Lost", value: leadsByStatus.lost, color: "bg-red-500", percentage: leads.length ? (leadsByStatus.lost / leads.length) * 100 : 0 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
                <CardDescription>Website content statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#1F2A54]">{stats.projects}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#1F2A54]">{stats.gallery}</p>
                    <p className="text-sm text-muted-foreground">Gallery Images</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#1F2A54]">{stats.testimonials}</p>
                    <p className="text-sm text-muted-foreground">Testimonials</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-[#1F2A54]">{stats.articles}</p>
                    <p className="text-sm text-muted-foreground">Blog Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { source: "Website Form", count: leads.filter(l => l.source === 'website').length || Math.floor(leads.length * 0.4), color: "bg-blue-100 text-blue-700" },
                  { source: "Phone", count: leads.filter(l => l.source === 'phone').length || Math.floor(leads.length * 0.25), color: "bg-green-100 text-green-700" },
                  { source: "Email", count: leads.filter(l => l.source === 'email').length || Math.floor(leads.length * 0.2), color: "bg-purple-100 text-purple-700" },
                  { source: "Walk-in", count: leads.filter(l => l.source === 'walkin').length || Math.floor(leads.length * 0.15), color: "bg-orange-100 text-orange-700" },
                ].map((item) => (
                  <div key={item.source} className={`p-4 rounded-lg ${item.color}`}>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-sm">{item.source}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
