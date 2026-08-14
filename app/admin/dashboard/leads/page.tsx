"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLeads, updateLead, deleteLead, type Lead } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Search, Trash2, Mail, Phone, MessageSquare, 
  Eye, Calendar, MapPin, Building, User, Filter,
  Download, RefreshCw
} from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-purple-100 text-purple-800 border-purple-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  saved: "bg-gray-100 text-gray-800 border-gray-200",
};

const sourceLabels: Record<string, string> = {
  enquiry_form: "Enquiry Now Button",
  contact_form: "Contact Us Form",
  property_enquiry: "Property Page",
  callback_request: "Callback Request",
  whatsapp: "WhatsApp",
  phone: "Phone Call",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

export default function LeadsCRMPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  const fetchLeads = async () => {
    setLoadingData(true);
    try {
      const data = await getLeads();
      setLeads(data);
      setFilteredLeads(data);
    } catch {
      // Firestore permissions not configured - use empty state
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  useEffect(() => {
    let filtered = leads;
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }
    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, sourceFilter, leads]);

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    try {
      await updateLead(id, { status });
      setLeads(leads.map(lead => lead.id === id ? { ...lead, status } : lead));
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead?.id) return;
    setSavingNotes(true);
    try {
      await updateLead(selectedLead.id, { notes } as Partial<Lead>);
      setLeads(leads.map(lead => lead.id === selectedLead.id ? { ...lead, notes } : lead));
      setSelectedLead({ ...selectedLead, notes } as Lead);
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
      setLeads(leads.filter(lead => lead.id !== id));
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes((lead as Lead & { notes?: string }).notes || "");
    setShowDetailModal(true);
  };

  const exportLeads = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Source", "Status", "Message", "Date"].join(","),
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        sourceLabels[lead.source] || lead.source,
        lead.status,
        `"${lead.message?.replace(/"/g, '""') || ''}"`,
        lead.createdAt?.toDate?.()?.toLocaleDateString() || ''
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: leads.length,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      rejected: 0,
      saved: 0,
    };
    leads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Leads CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all your customer enquiries
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchLeads} disabled={loadingData}>
            <RefreshCw size={16} className={loadingData ? "animate-spin" : ""} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" onClick={exportLeads}>
            <Download size={16} />
            <span className="ml-2 hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "new", "contacted", "qualified", "converted", "rejected", "saved"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === status
                ? "bg-[#1F2A54] text-white"
                : "bg-secondary hover:bg-secondary/80 text-[#1F2A54]"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 opacity-70">({statusCounts[status] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="enquiry_form">Enquiry Now Button</SelectItem>
            <SelectItem value="contact_form">Contact Us Form</SelectItem>
            <SelectItem value="property_enquiry">Property Page</SelectItem>
            <SelectItem value="callback_request">Callback Request</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="phone">Phone Call</SelectItem>
            <SelectItem value="walk_in">Walk-in</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Leads will appear here when customers submit enquiry forms
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card 
              key={lead.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openLeadDetail(lead)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[#1F2A54] text-lg">{lead.name}</h3>
                      <Badge className={statusColors[lead.status]}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail size={14} /> {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {sourceLabels[lead.source] || lead.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {lead.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    {lead.message && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                        <MessageSquare size={14} className="inline mr-1" />
                        {lead.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Select 
                      value={lead.status} 
                      onValueChange={(value) => handleStatusChange(lead.id!, value as Lead['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="saved">Saved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => openLeadDetail(lead)}>
                      <Eye size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1F2A54]">Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-[#1F2A54] font-semibold">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Select 
                      value={selectedLead.status} 
                      onValueChange={(value) => handleStatusChange(selectedLead.id!, value as Lead['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="saved">Saved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail size={14} />
                    <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">
                      {selectedLead.email}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="flex items-center gap-2">
                    <Phone size={14} />
                    <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">
                      {selectedLead.phone}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="flex items-center gap-2">
                    <Building size={14} />
                    {sourceLabels[selectedLead.source] || selectedLead.source}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="flex items-center gap-2">
                    <Calendar size={14} />
                    {selectedLead.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <p className="mt-1 p-3 bg-secondary rounded-lg text-sm">{selectedLead.message}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="mt-1"
                  rows={4}
                />
                <Button 
                  onClick={handleSaveNotes} 
                  disabled={savingNotes}
                  className="mt-2 bg-[#1F2A54] hover:bg-[#1F2A54]/90"
                >
                  {savingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Notes
                </Button>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedLead.id!)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Lead
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedLead.email}`}>
                      <Mail size={16} className="mr-2" />
                      Send Email
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`tel:${selectedLead.phone}`}>
                      <Phone size={16} className="mr-2" />
                      Call
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
