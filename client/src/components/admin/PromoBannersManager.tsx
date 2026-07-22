import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, MousePointerClick, Percent } from "lucide-react";
import type { PromoBanner } from "../../../../shared/catalog-schema";

const PLACEMENTS = [
  { value: "site-wide", label: "Site-Wide Top Bar" },
  { value: "announcement", label: "Announcement (under navbar)" },
  { value: "home", label: "Home Page" },
  { value: "browse", label: "Browse Shows" },
  { value: "compare", label: "Compare Shows" },
  { value: "research", label: "Research Pages" },
];

const VARIANTS = [
  { value: "top-bar", label: "Top Bar (slim)" },
  { value: "hero", label: "Hero (large announcement)" },
  { value: "testimonial", label: "Testimonial (quote)" },
  { value: "card", label: "Card (headline + CTA)" },
  { value: "quiet", label: "Quiet (subtle dark card)" },
];

interface BannerForm {
  placement: string;
  name: string;
  headline: string;
  body: string;
  ctaText: string;
  targetUrl: string;
  variant: string;
  showLogo: boolean;
  showAppBadges: boolean;
  isActive: boolean;
}

const emptyForm: BannerForm = {
  placement: "home",
  name: "",
  headline: "",
  body: "",
  ctaText: "Try it free →",
  targetUrl: "https://kidsafetv.com",
  variant: "card",
  showLogo: false,
  showAppBadges: false,
  isActive: true,
};

function ctr(banner: PromoBanner): string {
  if (!banner.impressions) return "—";
  return ((banner.clicks / banner.impressions) * 100).toFixed(1) + "%";
}

export default function PromoBannersManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);

  const { data: banners = [], isLoading } = useQuery<PromoBanner[]>({
    queryKey: ["/api/admin/promo-banners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-banners");
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-banners"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, body: form.body || null };
      const res = await fetch(
        editingId ? `/api/admin/promo-banners/${editingId}` : "/api/admin/promo-banners",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save banner");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: editingId ? "Banner updated" : "Banner created" });
    },
    onError: () => toast({ title: "Failed to save banner", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/promo-banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update banner");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Failed to update banner", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/promo-banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete banner");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Banner deleted" });
    },
    onError: () => toast({ title: "Failed to delete banner", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (banner: PromoBanner) => {
    setEditingId(banner.id);
    setForm({
      placement: banner.placement,
      name: banner.name,
      headline: banner.headline,
      body: banner.body || "",
      ctaText: banner.ctaText,
      targetUrl: banner.targetUrl,
      variant: banner.variant,
      showLogo: banner.showLogo,
      showAppBadges: banner.showAppBadges,
      isActive: banner.isActive,
    });
    setDialogOpen(true);
  };

  const totals = banners.reduce(
    (acc, b) => ({ impressions: acc.impressions + b.impressions, clicks: acc.clicks + b.clicks }),
    { impressions: 0, clicks: 0 }
  );
  const totalCtr = totals.impressions
    ? ((totals.clicks / totals.impressions) * 100).toFixed(1) + "%"
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">KidSafeTV Banners</h2>
          <p className="text-muted-foreground">
            Manage promotional banners and track their performance
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Performance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall CTR</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCtr}</div>
          </CardContent>
        </Card>
      </div>

      {/* Banner list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading banners...</div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">{banner.name}</span>
                      <Badge variant="outline">
                        {PLACEMENTS.find((p) => p.value === banner.placement)?.label ||
                          banner.placement}
                      </Badge>
                      <Badge variant="secondary">{banner.variant}</Badge>
                      {banner.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{banner.headline}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {banner.impressions.toLocaleString()} impressions
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" /> {banner.clicks.toLocaleString()} clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" /> {ctr(banner)} CTR
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 mr-2">
                      <Label htmlFor={`active-${banner.id}`} className="text-xs text-muted-foreground">
                        Active
                      </Label>
                      <Switch
                        id={`active-${banner.id}`}
                        checked={banner.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: banner.id, isActive: checked })
                        }
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(banner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Delete banner "${banner.name}"?`)) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {banners.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No banners yet. Click "Add Banner" to create one.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Internal Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Home Testimonial"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placement</Label>
                <Select
                  value={form.placement}
                  onValueChange={(v) => setForm({ ...form, placement: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Style</Label>
                <Select
                  value={form.variant}
                  onValueChange={(v) => setForm({ ...form, variant: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANTS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Headline</Label>
              <Textarea
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Body (optional)</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Text</Label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                />
              </div>
              <div>
                <Label>Target URL</Label>
                <Input
                  value={form.targetUrl}
                  onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="form-show-logo"
                checked={form.showLogo}
                onCheckedChange={(checked) => setForm({ ...form, showLogo: checked })}
              />
              <Label htmlFor="form-show-logo">Show KidSafeTV logo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="form-show-badges"
                checked={form.showAppBadges}
                onCheckedChange={(checked) => setForm({ ...form, showAppBadges: checked })}
              />
              <Label htmlFor="form-show-badges">Show App Store / Google Play badges</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="form-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="form-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending || !form.name || !form.headline || !form.ctaText
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
