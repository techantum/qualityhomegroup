"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProjects, type Project } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Eye,
  Sprout,
} from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      // Prefer API (Admin SDK) so list works even when client Firestore rules block read
      if (user && typeof user.getIdToken === "function") {
        const token = await user.getIdToken();
        const res = await fetch("/api/v1/projects", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setProjects(json.data ?? []);
          setLoading(false);
          return;
        }
      }
      const data = await getProjects();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject?.id || !user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/projects/${deletingProject.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Delete failed (${res.status})`);
      }
      await loadProjects();
      setDeleteDialogOpen(false);
      setDeletingProject(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(error instanceof Error ? error.message : "Unable to delete the project.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedProjects = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/v1/seed/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Seed failed: Unauthorized. Add Firebase Admin env vars to .env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
          );
        }
        throw new Error(data?.error || `Seed failed (${res.status})`);
      }
      await loadProjects();
    } catch (error) {
      console.error("Seed error:", error);
      alert(error instanceof Error ? error.message : "Failed to seed projects");
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanDuplicates = async () => {
    if (!user) return;
    setCleaningDuplicates(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/v1/seed/clean-duplicate-projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Clean failed (${res.status})`);
      }
      const { deleted, kept, deletedTitles } = data?.data ?? {};
      await loadProjects();
      if (deleted > 0) {
        alert(`Removed ${deleted} duplicate project(s). Kept ${kept}.\nDeleted: ${(deletedTitles ?? []).join(", ") || "—"}`);
      } else {
        alert("No duplicate projects found (same title).");
      }
    } catch (error) {
      console.error("Clean duplicates error:", error);
      alert(error instanceof Error ? error.message : "Failed to clean duplicates");
    } finally {
      setCleaningDuplicates(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[#1F2A54]">All Projects</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSeedProjects}
            disabled={seeding}
            className="w-full sm:w-auto"
          >
            {seeding ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sprout size={18} className="mr-2" />}
            {seeding ? "Seeding..." : "Seed 5 projects"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCleanDuplicates}
            disabled={cleaningDuplicates}
            className="w-full sm:w-auto"
          >
            {cleaningDuplicates ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Trash2 size={18} className="mr-2" />}
            {cleaningDuplicates ? "Cleaning..." : "Clean duplicates"}
          </Button>
          <Link href="/admin/dashboard/projects/new">
            <Button className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white w-full sm:w-auto">
              <Plus size={18} className="mr-2" />
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet. Add your first project or seed sample data.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSeedProjects}
                disabled={seeding}
              >
                {seeding ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sprout size={18} className="mr-2" />}
                {seeding ? "Seeding..." : "Seed 5 projects"}
              </Button>
              <Link href="/admin/dashboard/projects/new">
                <Button className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white">
                  <Plus size={18} className="mr-2" />
                  Add Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-200">
                          {project.image ? (
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-[#1F2A54]">
                        {project.title}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-[#DDA21A]/10 text-[#DDA21A] rounded text-sm">
                          {project.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin size={14} />
                          {project.location}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/property/${project.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link href={`/admin/dashboard/projects/${project.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                              <Pencil size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 bg-transparent"
                            onClick={() => {
                              setDeletingProject(project);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                      {project.image ? (
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1F2A54] truncate">{project.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-[#DDA21A]/10 text-[#DDA21A] rounded text-xs">
                          {project.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={12} />
                          {project.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                    <Link href={`/property/${project.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="h-8 px-3 bg-transparent text-xs">
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </Link>
                    <Link href={`/admin/dashboard/projects/${project.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 bg-transparent text-xs">
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 bg-transparent text-xs"
                      onClick={() => {
                        setDeletingProject(project);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingProject?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
