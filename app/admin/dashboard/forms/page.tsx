"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getFormSubmissions,
  getFormConfigs,
  markSubmissionAsRead,
  deleteFormSubmission,
  addFormConfig,
  updateFormConfig,
  deleteFormConfig,
  type FormSubmission,
  type FormConfig,
  type FormField,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Eye,
  Mail,
  Download,
  Search,
  Filter,
  Inbox,
  Check,
  X,
  Settings,
  FormInput,
} from "lucide-react";

export default function FormsManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [formConfigs, setFormConfigs] = useState<FormConfig[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [filterForm, setFilterForm] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<FormSubmission | null>(null);

  // Form Builder State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormConfig | null>(null);
  const [formFormData, setFormFormData] = useState<Omit<FormConfig, "id" | "createdAt" | "updatedAt">>({
    name: "",
    slug: "",
    fields: [],
    successMessage: "Thank you for your submission!",
    emailNotification: "",
    isActive: true,
  });
  const [savingForm, setSavingForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [submissionsData, configsData] = await Promise.all([
          getFormSubmissions(),
          getFormConfigs(),
        ]);
        setSubmissions(submissionsData);
        setFormConfigs(configsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleViewSubmission = async (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    if (!submission.isRead) {
      try {
        await markSubmissionAsRead(submission.id!);
        setSubmissions(submissions.map((s) => (s.id === submission.id ? { ...s, isRead: true } : s)));
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
      await deleteFormSubmission(submissionToDelete.id!);
      setSubmissions(submissions.filter((s) => s.id !== submissionToDelete.id));
      setDeleteConfirmOpen(false);
      setSubmissionToDelete(null);
      if (selectedSubmission?.id === submissionToDelete.id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  };

  const confirmDeleteSubmission = (submission: FormSubmission) => {
    setSubmissionToDelete(submission);
    setDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const filtered = getFilteredSubmissions();
    if (filtered.length === 0) return;

    // Get all unique field keys
    const allFields = new Set<string>();
    filtered.forEach((s) => Object.keys(s.fields).forEach((k) => allFields.add(k)));
    const fieldKeys = Array.from(allFields);

    // Create CSV header
    const headers = ["Form", "Date", "Source", ...fieldKeys];
    const rows = filtered.map((s) => [
      s.formName,
      s.createdAt?.toDate().toLocaleDateString() || "",
      s.source,
      ...fieldKeys.map((k) => s.fields[k] || ""),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Form Builder Functions
  const handleSaveForm = async () => {
    setSavingForm(true);

    try {
      if (editingForm) {
        await updateFormConfig(editingForm.id!, formFormData);
        setFormConfigs(formConfigs.map((f) => (f.id === editingForm.id ? { ...f, ...formFormData } : f)));
      } else {
        const id = await addFormConfig(formFormData);
        setFormConfigs([...formConfigs, { id, ...formFormData }]);
      }
      setIsFormDialogOpen(false);
      resetFormBuilder();
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setSavingForm(false);
    }
  };

  const handleEditForm = (form: FormConfig) => {
    setEditingForm(form);
    setFormFormData({
      name: form.name,
      slug: form.slug,
      fields: form.fields || [],
      successMessage: form.successMessage,
      emailNotification: form.emailNotification || "",
      isActive: form.isActive,
    });
    setIsFormDialogOpen(true);
  };

  const handleDeleteForm = async (form: FormConfig) => {
    if (!confirm(`Delete form "${form.name}"? This will not delete existing submissions.`)) return;
    
    try {
      await deleteFormConfig(form.id!);
      setFormConfigs(formConfigs.filter((f) => f.id !== form.id));
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  const addField = () => {
    const newField: FormField = {
      name: `field_${formFormData.fields.length + 1}`,
      label: "",
      type: "text",
      placeholder: "",
      required: false,
    };
    setFormFormData({
      ...formFormData,
      fields: [...formFormData.fields, newField],
    });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...formFormData.fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFormFormData({ ...formFormData, fields: updatedFields });
  };

  const removeField = (index: number) => {
    setFormFormData({
      ...formFormData,
      fields: formFormData.fields.filter((_, i) => i !== index),
    });
  };

  const resetFormBuilder = () => {
    setEditingForm(null);
    setFormFormData({
      name: "",
      slug: "",
      fields: [],
      successMessage: "Thank you for your submission!",
      emailNotification: "",
      isActive: true,
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const getFilteredSubmissions = () => {
    return submissions.filter((s) => {
      const matchesForm = filterForm === "all" || s.formId === filterForm;
      const matchesRead =
        filterRead === "all" || (filterRead === "unread" ? !s.isRead : s.isRead);
      const matchesSearch =
        searchQuery === "" ||
        Object.values(s.fields).some((v) =>
          v.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        s.formName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesForm && matchesRead && matchesSearch;
    });
  };

  const filteredSubmissions = getFilteredSubmissions();
  const unreadCount = submissions.filter((s) => !s.isRead).length;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Forms & Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage contact forms and view submissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Inbox size={16} />
            Submissions
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <FormInput size={16} />
            Form Builder
          </TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submissions List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search submissions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Select value={filterForm} onValueChange={setFilterForm}>
                        <SelectTrigger className="w-full md:w-40">
                          <Filter size={14} className="mr-2" />
                          <SelectValue placeholder="All Forms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Forms</SelectItem>
                          {formConfigs.map((form) => (
                            <SelectItem key={form.id} value={form.id!}>
                              {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterRead} onValueChange={setFilterRead}>
                        <SelectTrigger className="w-full md:w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unread">Unread</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={handleExportCSV} disabled={filteredSubmissions.length === 0}>
                        <Download size={14} className="mr-2" /> Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Submissions List */}
                <Card>
                  <CardContent className="p-0">
                    {filteredSubmissions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No submissions found</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>Form</TableHead>
                                <TableHead>Preview</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-12"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSubmissions.map((submission) => (
                                <TableRow
                                  key={submission.id}
                                  className={`cursor-pointer ${
                                    !submission.isRead ? "bg-blue-50/50" : ""
                                  } ${selectedSubmission?.id === submission.id ? "bg-secondary" : ""}`}
                                  onClick={() => handleViewSubmission(submission)}
                                >
                                  <TableCell>
                                    {!submission.isRead && (
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{submission.formName}</Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                    {Object.values(submission.fields).slice(0, 2).join(", ")}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {submission.createdAt?.toDate().toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical size={16} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewSubmission(submission)}>
                                          <Eye size={14} className="mr-2" /> View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDeleteSubmission(submission);
                                          }}
                                        >
                                          <Trash2 size={14} className="mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y">
                          {filteredSubmissions.map((submission) => (
                            <div
                              key={submission.id}
                              className={`p-4 cursor-pointer ${
                                !submission.isRead ? "bg-blue-50/50" : ""
                              } ${selectedSubmission?.id === submission.id ? "bg-secondary" : ""}`}
                              onClick={() => handleViewSubmission(submission)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {!submission.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                  )}
                                  <Badge variant="outline" className="text-xs">{submission.formName}</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {submission.createdAt?.toDate().toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                {Object.values(submission.fields).slice(0, 2).join(", ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Submission Detail */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Submission Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSubmission ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{selectedSubmission.formName}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {selectedSubmission.createdAt?.toDate().toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {Object.entries(selectedSubmission.fields).map(([key, value]) => (
                            <div key={key}>
                              <Label className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, " ")}
                              </Label>
                              <p className="text-sm mt-1 break-words">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                          <p>Source: {selectedSubmission.source}</p>
                          {selectedSubmission.userAgent && (
                            <p className="truncate">Browser: {selectedSubmission.userAgent}</p>
                          )}
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => confirmDeleteSubmission(selectedSubmission)}
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a submission to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Forms Builder Tab */}
        <TabsContent value="forms">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1F2A54]">Manage Forms</h2>
            <Button
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              onClick={() => {
                resetFormBuilder();
                setIsFormDialogOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> Create Form
            </Button>
          </div>

          {formConfigs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FormInput className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No forms created yet</p>
                <Button
                  className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
                  onClick={() => {
                    resetFormBuilder();
                    setIsFormDialogOpen(true);
                  }}
                >
                  <Plus size={16} className="mr-2" /> Create First Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formConfigs.map((form) => (
                <Card key={form.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>/{form.slug}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {form.fields?.length || 0} fields
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditForm(form)}>
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 bg-transparent"
                        onClick={() => handleDeleteForm(form)}
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmission}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Builder Dialog */}
      <Dialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          setIsFormDialogOpen(open);
          if (!open) resetFormBuilder();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? "Edit Form" : "Create New Form"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Form Name</Label>
                <Input
                  value={formFormData.name}
                  onChange={(e) =>
                    setFormFormData({
                      ...formFormData,
                      name: e.target.value,
                      slug: editingForm ? formFormData.slug : generateSlug(e.target.value),
                    })
                  }
                  placeholder="Contact Form"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formFormData.slug}
                  onChange={(e) =>
                    setFormFormData({ ...formFormData, slug: generateSlug(e.target.value) })
                  }
                  placeholder="contact-form"
                />
              </div>
            </div>

            <div>
              <Label>Success Message</Label>
              <Textarea
                value={formFormData.successMessage}
                onChange={(e) => setFormFormData({ ...formFormData, successMessage: e.target.value })}
                placeholder="Thank you for your submission!"
                rows={2}
              />
            </div>

            <div>
              <Label>Email Notification (optional)</Label>
              <Input
                type="email"
                value={formFormData.emailNotification}
                onChange={(e) => setFormFormData({ ...formFormData, emailNotification: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Form Active</Label>
              <Switch
                checked={formFormData.isActive}
                onCheckedChange={(checked) => setFormFormData({ ...formFormData, isActive: checked })}
              />
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Form Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus size={14} className="mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {formFormData.fields.map((field, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(index, {
                                label: e.target.value,
                                name: generateSlug(e.target.value),
                              })
                            }
                            placeholder="Field Label"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: FormField["type"]) => updateField(index, { type: value })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            placeholder="Placeholder text"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(index, { required: checked })}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 h-8 w-8"
                            onClick={() => removeField(index)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>

                      {(field.type === "select" || field.type === "checkbox" || field.type === "radio") && (
                        <div className="mt-2">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {formFormData.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fields added. Click "Add Field" to get started.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#1F2A54]" onClick={handleSaveForm} disabled={savingForm}>
              {savingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingForm ? "Update" : "Create"} Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
