"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import type { SiteScript, ScriptPlacement } from "@/lib/firestore-types";
import {
  mergeSitePageOptions,
  pageLabel,
  takenPageSlugs,
  type SitePageOption,
} from "@/lib/site-pages";
import { PageMultiSelect } from "@/components/admin/page-multiselect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const emptyForm = {
  name: "",
  placement: "header" as ScriptPlacement,
  appliesToAll: false,
  pageSlugs: [] as string[],
  content: "",
  isActive: true,
};

export default function ScriptsManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scripts, setScripts] = useState<SiteScript[]>([]);
  const [pages, setPages] = useState<SitePageOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SiteScript | null>(null);
  const [toDelete, setToDelete] = useState<SiteScript | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function load() {
      try {
        const [scriptsRes, categoriesRes, cmsRes] = await Promise.all([
          adminApiFetch(currentUser, "/api/v1/scripts"),
          fetch("/api/v1/categories"),
          fetch("/api/v1/cms/pages"),
        ]);
        const scriptsJson = await scriptsRes.json().catch(() => ({}));
        const categoriesJson = await categoriesRes.json().catch(() => ({}));
        const cmsJson = await cmsRes.json().catch(() => ({}));

        if (!scriptsRes.ok) throw new Error(scriptsJson?.error ?? "Failed to load scripts");
        setScripts((scriptsJson.data ?? []) as SiteScript[]);

        const extras: SitePageOption[] = [
          ...((categoriesJson.data ?? []) as Array<{ name?: string; slug?: string }>).map((item) => ({
            slug: item.slug ?? "",
            label: item.name ?? item.slug ?? "",
            path: `/${item.slug ?? ""}`,
          })),
          ...((cmsJson.data ?? []) as Array<{ title?: string; slug?: string }>).map((item) => ({
            slug: item.slug ?? "",
            label: item.title ?? item.slug ?? "",
            path: `/${item.slug ?? ""}`,
          })),
        ];
        setPages(mergeSitePageOptions(extras));
      } catch (error) {
        console.error("Error loading scripts:", error);
        setScripts([]);
        setPages(mergeSitePageOptions());
      } finally {
        setLoadingData(false);
      }
    }

    load();
  }, [user]);

  const headerScripts = scripts.filter((script) => script.placement === "header");
  const footerScripts = scripts.filter((script) => script.placement === "footer");

  const taken = useMemo(
    () => takenPageSlugs(scripts, form.placement, editing?.id),
    [scripts, form.placement, editing?.id],
  );

  const canAdd = (placement: ScriptPlacement) => {
    const info = takenPageSlugs(scripts, placement);
    return !info.allTaken && info.slugs.size < pages.length;
  };

  const openCreate = (placement: ScriptPlacement) => {
    setEditing(null);
    setForm({ ...emptyForm, placement });
    setDialogOpen(true);
  };

  const openEdit = (script: SiteScript) => {
    setEditing(script);
    setForm({
      name: script.name,
      placement: script.placement,
      appliesToAll: script.appliesToAll,
      pageSlugs: script.pageSlugs ?? [],
      content: script.content,
      isActive: script.isActive,
    });
    setDialogOpen(true);
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!form.appliesToAll && form.pageSlugs.length === 0) {
      alert("Select All pages or at least one page.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        placement: form.placement,
        appliesToAll: form.appliesToAll,
        pageSlugs: form.appliesToAll ? [] : form.pageSlugs,
        content: form.content,
        isActive: form.isActive,
      };
      const res = editing?.id
        ? await adminApiFetch(user, `/api/v1/scripts/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await adminApiFetch(user, "/api/v1/scripts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);

      if (editing?.id) {
        setScripts((prev) =>
          prev.map((script) => (script.id === editing.id ? { ...script, ...payload } : script)),
        );
      } else {
        const id = String(json?.data?.id ?? crypto.randomUUID());
        setScripts((prev) => [...prev, { id, ...payload, order: prev.length }]);
      }
      resetDialog();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error saving script.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !toDelete?.id) return;
    try {
      const res = await adminApiFetch(user, `/api/v1/scripts/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `Delete failed (${res.status})`);
      }
      setScripts((prev) => prev.filter((script) => script.id !== toDelete.id));
      setDeleteOpen(false);
      setToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error deleting script.");
    }
  };

  const toggleActive = async (script: SiteScript) => {
    if (!user || !script.id) return;
    try {
      const res = await adminApiFetch(user, `/api/v1/scripts/${script.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !script.isActive }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Update failed (${res.status})`);
      setScripts((prev) =>
        prev.map((item) => (item.id === script.id ? { ...item, isActive: !item.isActive } : item)),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error updating script.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  const renderList = (placement: ScriptPlacement, items: SiteScript[]) => {
    const addable = canAdd(placement);
    return (
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="capitalize">{placement} scripts</CardTitle>
            <CardDescription>
              Add tracking, chat, or custom code to the {placement} of selected pages.
            </CardDescription>
          </div>
          <Button
            className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            disabled={!addable}
            onClick={() => openCreate(placement)}
            title={addable ? undefined : "All pages are already assigned. Edit or delete an existing script first."}
          >
            <Plus size={16} className="mr-2" />
            Add {placement} script
          </Button>
        </CardHeader>
        <CardContent>
          {!addable && items.length > 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              Every page already has a {placement} script. Selected pages are hidden from the next add option.
            </p>
          )}
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <Code2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No {placement} scripts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((script) => (
                <div
                  key={script.id}
                  className={`rounded-lg border p-4 ${script.isActive ? "" : "opacity-60"}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#1F2A54]">{script.name}</h3>
                        {!script.isActive && (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {script.appliesToAll ? (
                          <Badge variant="secondary">All pages</Badge>
                        ) : (
                          script.pageSlugs.map((slug) => (
                            <Badge key={slug} variant="secondary">
                              {pageLabel(slug, pages)}
                            </Badge>
                          ))
                        )}
                      </div>
                      <pre className="mt-3 max-h-24 overflow-auto rounded bg-secondary/60 p-2 text-xs text-muted-foreground">
                        {script.content}
                      </pre>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-2 pr-2">
                        <Switch checked={script.isActive} onCheckedChange={() => toggleActive(script)} />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => openEdit(script)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600"
                        onClick={() => {
                          setToDelete(script);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2A54]">Header & Footer Scripts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add multiple scripts to selected website pages. A page used in one script is hidden when you add the next
          script in the same placement.
        </p>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <div className="space-y-6">
          {renderList("header", headerScripts)}
          {renderList("footer", footerScripts)}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit script" : `Add ${form.placement} script`}</DialogTitle>
            <DialogDescription>
              Choose pages from the dropdown. Pages already assigned to another {form.placement} script are not shown.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="script-name">Script name</Label>
              <Input
                id="script-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Google Analytics, Chat widget..."
                required
              />
            </div>

            <div>
              <Label>Pages</Label>
              <PageMultiSelect
                pages={pages}
                selected={form.pageSlugs}
                appliesToAll={form.appliesToAll}
                takenSlugs={taken.slugs}
                allTaken={taken.allTaken}
                onChange={({ appliesToAll, pageSlugs }) =>
                  setForm({ ...form, appliesToAll, pageSlugs })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use All pages to apply this script site-wide, or multi-select specific pages.
              </p>
            </div>

            <div>
              <Label htmlFor="script-content">Script code</Label>
              <Textarea
                id="script-content"
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                placeholder={'<script>\n  // paste snippet here\n</script>'}
                rows={10}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Disable to keep the script saved but not injected.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update script" : "Add script"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete script</DialogTitle>
            <DialogDescription>
              Delete &quot;{toDelete?.name}&quot;? Its pages will become available again in the add dropdown.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
