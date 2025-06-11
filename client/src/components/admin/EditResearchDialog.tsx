import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Upload } from "lucide-react";

interface ResearchSummary {
  id?: number;
  title: string;
  category: string;
  source: string;
  publishedDate: string;
  originalStudyUrl?: string;
  imageUrl?: string;
  headline?: string;
  subHeadline?: string;
  summary?: string;
  keyFindings?: string;
  fullText?: string;
}

interface EditResearchDialogProps {
  research: ResearchSummary | null;
  isOpen: boolean;
  onClose: () => void;
  isAddingNew?: boolean;
}

const RESEARCH_CATEGORIES = [
  "Learning Outcomes",
  "Cognitive Development", 
  "Parental Guidance",
  "Media Effects",
  "Screen Time",
  "Educational Technology",
  "Child Development",
  "Digital Literacy",
  "Social Development",
  "Behavioral Studies"
];

export function EditResearchDialog({ research, isOpen, onClose, isAddingNew = false }: EditResearchDialogProps) {
  const [formData, setFormData] = useState<ResearchSummary>({
    title: "",
    category: "",
    source: "",
    publishedDate: "",
    originalStudyUrl: "",
    imageUrl: "",
    headline: "",
    subHeadline: "",
    summary: "",
    keyFindings: "",
    fullText: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (research) {
      setFormData({
        title: research.title || "",
        category: research.category || "",
        source: research.source || "",
        publishedDate: research.publishedDate || "",
        originalStudyUrl: research.originalStudyUrl || "",
        imageUrl: research.imageUrl || "",
        headline: research.headline || "",
        subHeadline: research.subHeadline || "",
        summary: research.summary || "",
        keyFindings: research.keyFindings || "",
        fullText: research.fullText || ""
      });
    } else if (isAddingNew) {
      setFormData({
        title: "",
        category: "",
        source: "",
        publishedDate: "",
        originalStudyUrl: "",
        imageUrl: "",
        headline: "",
        subHeadline: "",
        summary: "",
        keyFindings: "",
        fullText: ""
      });
    }
  }, [research, isAddingNew]);

  const mutation = useMutation({
    mutationFn: async (data: ResearchSummary) => {
      const url = isAddingNew ? '/api/admin/research' : `/api/admin/research/${research?.id}`;
      const method = isAddingNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save research');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/research'] });
      toast({
        title: "Success",
        description: `Research ${isAddingNew ? 'added' : 'updated'} successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isAddingNew ? 'add' : 'update'} research`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAddingNew ? 'Add Research Summary' : 'Edit Research Summary'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Research title"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="Research source (e.g., Journal name, University)"
                />
              </div>

              {/* Published Date */}
              <div className="space-y-2">
                <Label htmlFor="publishedDate">Published Date</Label>
                <div className="relative">
                  <Input
                    id="publishedDate"
                    type="date"
                    value={formatDateForInput(formData.publishedDate)}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishedDate: e.target.value }))}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Original Study URL */}
              <div className="space-y-2">
                <Label htmlFor="originalStudyUrl">Original Study URL</Label>
                <Input
                  id="originalStudyUrl"
                  type="url"
                  value={formData.originalStudyUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalStudyUrl: e.target.value }))}
                  placeholder="https://example.com/research-study"
                />
                <p className="text-xs text-muted-foreground">
                  Direct link to the original study or research paper
                </p>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="Main headline for the research"
                />
              </div>

              {/* Sub-headline */}
              <div className="space-y-2">
                <Label htmlFor="subHeadline">Sub-headline</Label>
                <Input
                  id="subHeadline"
                  value={formData.subHeadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, subHeadline: e.target.value }))}
                  placeholder="Supporting subheadline"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Direct link to an image that represents this research
                </p>
                {formData.imageUrl && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <img 
                      src={formData.imageUrl} 
                      alt="Research preview" 
                      className="mx-auto max-h-32 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Help section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Help</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>📝 Tips for Research Entries</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Fields marked with * are required</li>
                    <li>Use clear, descriptive titles that explain the research</li>
                    <li>Include original study links when available</li>
                    <li>Format key findings as short, actionable insights</li>
                    <li>Choose relevant categories to help users find content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width fields */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief summary of the research findings"
                rows={4}
              />
            </div>

            {/* Key Findings */}
            <div className="space-y-2">
              <Label htmlFor="keyFindings">Key Findings</Label>
              <Textarea
                id="keyFindings"
                value={formData.keyFindings}
                onChange={(e) => setFormData(prev => ({ ...prev, keyFindings: e.target.value }))}
                placeholder="Bullet-point list of key findings (separate with new lines). They will be formatted as bullet points."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter each key finding on a new line. They will be formatted as bullet points.
              </p>
            </div>

            {/* Full Text */}
            <div className="space-y-2">
              <Label htmlFor="fullText">Full Text</Label>
              <Textarea
                id="fullText"
                value={formData.fullText}
                onChange={(e) => setFormData(prev => ({ ...prev, fullText: e.target.value }))}
                placeholder="Complete text of the research summary (separate paragraphs with new lines)"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Enter each paragraph on a separate line. Your text will be properly formatted when displayed.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending 
                ? (isAddingNew ? "Adding..." : "Saving...") 
                : (isAddingNew ? "Add Research" : "Save Changes")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}