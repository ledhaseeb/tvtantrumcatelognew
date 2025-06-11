import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  X, 
  Plus, 
  Upload,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TvShow {
  id?: number;
  name: string;
  description: string;
  ageRange: string;
  stimulationScore: number;
  interactivityLevel?: string;
  dialogueIntensity?: string;
  soundEffectsLevel?: string;
  totalMusicLevel?: string;
  sceneFrequency?: string;
  musicTempo?: string;
  themes?: string[];
  animationStyle?: string;
  imageUrl?: string;
  creator?: string;
  releaseYear?: number;
  episodeLength?: number;
  seasons?: number;
}

interface EditShowDialogProps {
  show: TvShow | null;
  isOpen: boolean;
  onClose: () => void;
  isAddingNew?: boolean;
}

const STIMULATION_OPTIONS = [
  { value: "1", label: "1 - Low" },
  { value: "2", label: "2 - Low-Moderate" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - High" },
  { value: "5", label: "5 - Very High" }
];

const LEVEL_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "Moderate-High", label: "Moderate-High" },
  { value: "High", label: "High" }
];

const COMMON_THEMES = [
  "Family Values", "Relatable Situations", "Problem Solving", "Preschool-Basics",
  "Family Relationships", "Creativity & Imagination", "Conflict Resolution",
  "Social Skills", "Educational Content", "Adventure", "Friendship",
  "Learning & Discovery", "Music & Songs", "Animals & Nature"
];

export function EditShowDialog({ show, isOpen, onClose, isAddingNew = false }: EditShowDialogProps) {
  const [formData, setFormData] = useState<TvShow>({
    name: "",
    description: "",
    ageRange: "",
    stimulationScore: 1,
    themes: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [themeSearch, setThemeSearch] = useState("");
  const [existingThemes, setExistingThemes] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      setFormData({
        name: show.name || "",
        description: show.description || "",
        ageRange: show.ageRange || "",
        stimulationScore: show.stimulationScore || 1,
        interactivityLevel: show.interactivityLevel || "",
        dialogueIntensity: show.dialogueIntensity || "",
        soundEffectsLevel: show.soundEffectsLevel || "",
        totalMusicLevel: show.totalMusicLevel || "",
        sceneFrequency: show.sceneFrequency || "",
        musicTempo: show.musicTempo || "",
        themes: show.themes || [],
        animationStyle: show.animationStyle || "",
        imageUrl: show.imageUrl || "",
        creator: show.creator || "",
        releaseYear: show.releaseYear || new Date().getFullYear(),
        episodeLength: show.episodeLength || 0,
        seasons: show.seasons || 1
      });
      setImagePreview(show.imageUrl || "");
    } else if (isAddingNew) {
      setFormData({
        name: "",
        description: "",
        ageRange: "",
        stimulationScore: 1,
        interactivityLevel: "",
        dialogueIntensity: "",
        soundEffectsLevel: "",
        totalMusicLevel: "",
        sceneFrequency: "",
        musicTempo: "",
        themes: [],
        animationStyle: "",
        imageUrl: "",
        creator: "",
        releaseYear: new Date().getFullYear(),
        episodeLength: 0,
        seasons: 1
      });
      setImagePreview("");
    }
    setImageFile(null);
  }, [show, isAddingNew]);

  // Fetch existing themes when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingThemes();
    }
  }, [isOpen]);

  const fetchExistingThemes = async () => {
    try {
      const response = await fetch('/api/admin/themes');
      if (response.ok) {
        const themes = await response.json();
        setExistingThemes(themes);
      }
    } catch (error) {
      console.error('Failed to fetch existing themes:', error);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isAddingNew ? '/api/admin/shows' : `/api/admin/shows/${show?.id}`;
      const method = isAddingNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        body: data,
      });
      
      if (!response.ok) throw new Error('Failed to save show');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tv-shows'] });
      toast({
        title: "Success",
        description: `Show ${isAddingNew ? 'created' : 'updated'} successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isAddingNew ? 'create' : 'update'} show`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'themes' && Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });
    
    // Add image if selected
    if (imageFile) {
      data.append('image', imageFile);
    }
    
    mutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeTheme = (theme: string) => {
    setFormData(prev => ({
      ...prev,
      themes: prev.themes?.filter(t => t !== theme) || []
    }));
  };

  const addCommonTheme = (theme: string) => {
    if (!formData.themes?.includes(theme)) {
      setFormData(prev => ({
        ...prev,
        themes: [...(prev.themes || []), theme]
      }));
    }
  };

  const handleThemeAdd = () => {
    if (themeSearch.trim()) {
      // Check if there's an exact match in existing themes
      const exactMatch = existingThemes.find(theme => 
        theme.toLowerCase() === themeSearch.trim().toLowerCase()
      );
      
      if (exactMatch) {
        addCommonTheme(exactMatch);
      } else {
        // Add as new theme
        addCommonTheme(themeSearch.trim());
      }
      setThemeSearch("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAddingNew ? 'Add New TV Show' : `Edit TV Show`}
          </DialogTitle>
          {!isAddingNew && show && (
            <p className="text-sm text-muted-foreground">
              Update the details for {show.name}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label htmlFor="ageRange">Age Range</Label>
            <Input
              id="ageRange"
              value={formData.ageRange}
              onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
              placeholder="e.g., 3-8"
              required
            />
          </div>

          {/* Stimulation Score */}
          <div className="space-y-2">
            <Label htmlFor="stimulationScore">Stimulation Score</Label>
            <Select 
              value={String(formData.stimulationScore)} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, stimulationScore: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STIMULATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sensory Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interactivity</Label>
              <Select 
                value={formData.interactivityLevel || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, interactivityLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dialogue Intensity</Label>
              <Select 
                value={formData.dialogueIntensity || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, dialogueIntensity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sound Effects</Label>
              <Select 
                value={formData.soundEffectsLevel || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, soundEffectsLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Sound Effect Time</Label>
              <Select 
                value={formData.totalMusicLevel || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, totalMusicLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scene Frequency</Label>
              <Select 
                value={formData.sceneFrequency || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, sceneFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Music Tempo</Label>
              <Select 
                value={formData.musicTempo || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, musicTempo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Themes */}
          <div className="space-y-2">
            <Label>Themes</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.themes?.map((theme) => (
                <Badge key={theme} variant="secondary" className="text-sm">
                  {theme}
                  <button
                    type="button"
                    onClick={() => removeTheme(theme)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="space-y-3">
              {/* Single theme search/add field */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={themeSearch}
                    onChange={(e) => setThemeSearch(e.target.value)}
                    placeholder="Search for themes or add new theme..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleThemeAdd())}
                  />
                  <Button type="button" variant="outline" onClick={handleThemeAdd}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Show matching themes from database */}
                {themeSearch && (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                    {(() => {
                      const matchingThemes = existingThemes
                        .filter(theme => 
                          theme.toLowerCase().includes(themeSearch.toLowerCase()) &&
                          !formData.themes?.includes(theme)
                        )
                        .slice(0, 8);

                      if (matchingThemes.length > 0) {
                        return matchingThemes.map((theme) => (
                          <Button
                            key={theme}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              addCommonTheme(theme);
                              setThemeSearch("");
                            }}
                            className="w-full justify-start h-8 text-xs mb-1"
                          >
                            + {theme}
                          </Button>
                        ));
                      } else {
                        return (
                          <div className="p-2 text-xs text-muted-foreground">
                            No matching themes found. Click the + button to add "{themeSearch}" as a new theme.
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Common themes */}
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Or select from common themes:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_THEMES.filter(theme => !formData.themes?.includes(theme)).map((theme) => (
                    <Button
                      key={theme}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addCommonTheme(theme)}
                      className="h-6 text-xs"
                    >
                      + {theme}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Animation Style */}
          <div className="space-y-2">
            <Label htmlFor="animationStyle">Animation Style</Label>
            <Textarea
              id="animationStyle"
              value={formData.animationStyle || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, animationStyle: e.target.value }))}
              placeholder="e.g., Live-Action Family Videos"
              rows={2}
            />
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creator">Creator</Label>
              <Input
                id="creator"
                value={formData.creator || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, creator: e.target.value }))}
                placeholder="e.g., PBS Kids"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Release Year</Label>
              <Input
                id="releaseYear"
                type="number"
                value={formData.releaseYear || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseYear: parseInt(e.target.value) || 0 }))}
                placeholder="2024"
                min="1900"
                max="2030"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="episodeLength">Episode Length (minutes)</Label>
              <Input
                id="episodeLength"
                type="number"
                value={formData.episodeLength || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, episodeLength: parseInt(e.target.value) || 0 }))}
                placeholder="22"
                min="1"
                max="180"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasons">Seasons</Label>
              <Input
                id="seasons"
                type="number"
                value={formData.seasons || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, seasons: parseInt(e.target.value) || 1 }))}
                placeholder="1"
                min="1"
                max="50"
              />
            </div>
          </div>

          {/* Image Management */}
          <div className="space-y-2">
            <Label>Image Management</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {imageFile ? "New Image Selected" : "Current Show Image"}
                    </p>
                    <img 
                      src={imagePreview} 
                      alt={`${formData.name || 'Show'} image`} 
                      className="mx-auto max-w-40 max-h-48 object-cover rounded-lg border shadow-sm"
                    />
                    {!imageFile && formData.imageUrl && (
                      <p className="text-xs text-muted-foreground">
                        URL: {formData.imageUrl.length > 50 ? formData.imageUrl.substring(0, 50) + '...' : formData.imageUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {imageFile ? 'Choose Different' : 'Change Image'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                        setFormData(prev => ({ ...prev, imageUrl: "" }));
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">📺</div>
                  <p className="text-sm font-medium text-muted-foreground">No image available</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Upload a portrait-style image for the show (recommended ratio 3:4). 
                    The image will be automatically optimized for web display.
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {!isAddingNew && (
                <Button type="button" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Show
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}