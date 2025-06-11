import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, Eye, Filter, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import CategoryEditor from './CategoryEditor';
import type { HomepageCategory, InsertHomepageCategory, TvShow } from '@shared/catalog-schema';

interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'range';
  value: any;
}

interface FilterConfig {
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

interface FiltersType {
  ageGroup?: string;
  ageRange?: {min: number, max: number};
  sortBy?: string;
  search?: string;
  themes?: string[];
  themeMatchMode?: 'AND' | 'OR';
  interactivityLevel?: string;
  stimulationScoreRange?: {min: number, max: number};
}

export default function HomepageCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<HomepageCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/homepage-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/homepage-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<HomepageCategory[]>;
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertHomepageCategory) => {
      console.log('Creating category with data:', data);
      const response = await apiRequest('POST', '/api/admin/homepage-categories', data);
      console.log('Category creation response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('Category created successfully');
      toast({ title: 'Success', description: 'Category created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Category creation error:', error);
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomepageCategory> }) => {
      return apiRequest('PUT', `/api/admin/homepage-categories/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Category updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/homepage-categories/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Category deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    },
  });

  // Reorder category mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: number; newOrder: number }) => {
      console.log(`[REORDER] Updating category ${id} to order ${newOrder}`);
      const result = await apiRequest('PUT', `/api/admin/homepage-categories/${id}`, {
        displayOrder: newOrder
      });
      console.log(`[REORDER] API response:`, result);
      return result;
    },
    onSuccess: () => {
      console.log(`[REORDER] Success - invalidating cache`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
    },
    onError: (error) => {
      console.error(`[REORDER] Error:`, error);
      toast({ title: 'Error', description: 'Failed to reorder category', variant: 'destructive' });
    },
  });

  // Preview category shows
  const handlePreview = async (category: HomepageCategory) => {
    try {
      const response = await fetch(`/api/homepage-categories/${category.id}/shows`);
      if (!response.ok) throw new Error('Failed to fetch shows');
      const shows = await response.json();
      
      toast({
        title: 'Preview Results',
        description: `${shows.length} shows match this category's filters`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview category',
        variant: 'destructive',
      });
    }
  };

  // Helper functions for reordering
  const moveCategory = async (categoryId: number, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
    
    if (currentIndex === -1) return;
    
    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < sortedCategories.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return; // Cannot move further
    }
    
    const currentCategory = sortedCategories[currentIndex];
    const targetCategory = sortedCategories[targetIndex];
    
    console.log(`Moving category ${currentCategory.name} (order ${currentCategory.displayOrder}) ${direction}`);
    console.log(`Swapping with ${targetCategory.name} (order ${targetCategory.displayOrder})`);
    
    // Swap display orders - do one at a time to avoid race conditions
    try {
      await reorderMutation.mutateAsync({ id: currentCategory.id, newOrder: targetCategory.displayOrder });
      await reorderMutation.mutateAsync({ id: targetCategory.id, newOrder: currentCategory.displayOrder });
      
      toast({
        title: 'Success',
        description: `Moved "${currentCategory.name}" ${direction}`,
      });
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  // Sort categories by display order for consistent display
  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  // Show category editor if creating or editing
  if (isCreating || editingCategory) {
    return (
      <CategoryEditor
        category={editingCategory || undefined}
        onSubmit={(data) => {
          if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        onCancel={() => {
          setIsCreating(false);
          setEditingCategory(null);
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Homepage Categories</h2>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Category
        </Button>
      </div>

      <div className="grid gap-4">
        {sortedCategories.map((category: HomepageCategory, index: number) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log(`Up button clicked for category ${category.id} (${category.name})`);
                        moveCategory(category.id, 'up');
                      }}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log(`Down button clicked for category ${category.id} (${category.name})`);
                        moveCategory(category.id, 'down');
                      }}
                      disabled={index === sortedCategories.length - 1 || reorderMutation.isPending}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      {!category.isActive && <Badge variant="secondary">Inactive</Badge>}
                      <Badge variant="outline" className="text-xs">
                        {category.showCount || 0} shows
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(category)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(category.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Order: {category.displayOrder}</span>
                <span>•</span>
                <span>
                  Logic: {(typeof category.filterConfig === 'string' ? JSON.parse(category.filterConfig || '{}') : category.filterConfig).logic || 'AND'}
                </span>
                <span>•</span>
                <span>
                  Rules: {(typeof category.filterConfig === 'string' ? JSON.parse(category.filterConfig || '{}') : category.filterConfig).rules?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No categories created yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface CategoryFormProps {
  initialData?: HomepageCategory;
  onSubmit: (data: InsertHomepageCategory) => void;
  isLoading: boolean;
}

function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState<InsertHomepageCategory>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    displayOrder: initialData?.displayOrder || 0,
    isActive: initialData?.isActive ?? true,
    filterConfig: typeof initialData?.filterConfig === 'string' 
      ? initialData.filterConfig 
      : JSON.stringify(initialData?.filterConfig || { logic: 'AND', rules: [] })
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewFilters, setPreviewFilters] = useState<FiltersType>({});

  // Parse filter config for easier manipulation
  const parsedConfig: FilterConfig = typeof formData.filterConfig === 'string' 
    ? JSON.parse(formData.filterConfig || '{"logic":"AND","rules":[]}')
    : formData.filterConfig || { logic: 'AND', rules: [] };

  // Fetch all shows for preview
  const { data: allShows = [] } = useQuery({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  // Get unique themes for filter options
  const allThemes = Array.from(new Set(
    allShows.flatMap(show => show.themes || [])
  )).sort();

  // Convert filter rules to browse filters format for preview
  useEffect(() => {
    const convertedFilters: FiltersType = {};
    
    parsedConfig.rules?.forEach(rule => {
      switch (rule.field) {
        case 'themes':
          if (rule.operator === 'contains') {
            convertedFilters.themes = [rule.value];
            convertedFilters.themeMatchMode = parsedConfig.logic;
          }
          break;
        case 'stimulationScore':
          if (rule.operator === 'range') {
            const [min, max] = rule.value.split('-').map(Number);
            convertedFilters.stimulationScoreRange = { min, max };
          }
          break;
        case 'ageRange':
          if (rule.operator === 'contains') {
            convertedFilters.ageGroup = rule.value;
          }
          break;
        case 'interactivityLevel':
          if (rule.operator === 'equals') {
            convertedFilters.interactivityLevel = rule.value;
          }
          break;
      }
    });

    setPreviewFilters(convertedFilters);
  }, [formData.filterConfig]);

  // Calculate matching shows for preview
  const matchingShows = allShows.filter(show => {
    if (!showPreview) return false;

    let matches: boolean[] = [];

    // Apply each filter rule
    parsedConfig.rules?.forEach(rule => {
      // Skip rules with empty values or placeholder values
      if (!rule.value || rule.value === '' || rule.value === 'Select theme') {
        return;
      }

      let ruleMatches = false;

      switch (rule.field) {
        case 'themes':
          if (rule.operator === 'contains' && show.themes) {
            ruleMatches = show.themes.some(theme => 
              theme.toLowerCase().includes(rule.value.toLowerCase())
            );
          }
          break;
        case 'stimulationScore':
          if (rule.operator === 'range') {
            const [min, max] = rule.value.split('-').map(Number);
            const stimScore = (show as any).stimulation_score || show.stimulationScore;
            ruleMatches = stimScore >= min && stimScore <= max;
          }
          break;
        case 'ageRange':
          if (rule.operator === 'contains') {
            ruleMatches = show.ageRange.toLowerCase().includes(rule.value.toLowerCase());
          }
          break;
        case 'interactivityLevel':
          if (rule.operator === 'equals') {
            ruleMatches = show.interactivityLevel?.toLowerCase() === rule.value.toLowerCase();
          }
          break;
      }

      matches.push(ruleMatches);
    });

    // Apply logic (AND/OR) - if no valid rules, return false
    if (matches.length === 0) return false;
    return parsedConfig.logic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
  });

  const availableFields = [
    { value: 'themes', label: 'Themes' },
    { value: 'stimulationScore', label: 'Stimulation Score' },
    { value: 'ageRange', label: 'Age Range' },
    { value: 'interactivityLevel', label: 'Interactivity Level' }
  ];

  const addFilterRule = () => {
    const newConfig = {
      ...parsedConfig,
      rules: [...(parsedConfig.rules || []), { field: 'themes', operator: 'contains' as const, value: '' }]
    };
    setFormData(prev => ({
      ...prev,
      filterConfig: JSON.stringify(newConfig)
    }));
  };

  const removeFilterRule = (index: number) => {
    const newConfig = {
      ...parsedConfig,
      rules: parsedConfig.rules?.filter((_, i) => i !== index) || []
    };
    setFormData(prev => ({
      ...prev,
      filterConfig: JSON.stringify(newConfig)
    }));
  };

  const updateFilterRule = (index: number, field: keyof FilterRule, value: any) => {
    const newRules = [...(parsedConfig.rules || [])];
    newRules[index] = { ...newRules[index], [field]: value };
    const newConfig = { ...parsedConfig, rules: newRules };
    setFormData(prev => ({
      ...prev,
      filterConfig: JSON.stringify(newConfig)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Fantasy Shows"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Shows with magical, imaginative and fantasy elements"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Filter Configuration</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Live Preview'}
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="logic">Logic:</Label>
              <Select
                value={parsedConfig.logic}
                onValueChange={(value: 'AND' | 'OR') => {
                  const newConfig = { ...parsedConfig, logic: value };
                  setFormData(prev => ({ ...prev, filterConfig: JSON.stringify(newConfig) }));
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {parsedConfig.rules?.map((rule, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Field</Label>
                <Select
                  value={rule.field}
                  onValueChange={(value) => updateFilterRule(index, 'field', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>Operator</Label>
                <Select
                  value={rule.operator}
                  onValueChange={(value) => updateFilterRule(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="in">In</SelectItem>
                    <SelectItem value="range">Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Value</Label>
                {rule.field === 'themes' ? (
                  <Select
                    value={rule.value}
                    onValueChange={(value) => updateFilterRule(index, 'value', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {allThemes.map(theme => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : rule.field === 'stimulationScore' && rule.operator === 'range' ? (
                  <Select
                    value={rule.value}
                    onValueChange={(value) => updateFilterRule(index, 'value', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">Low (1-2)</SelectItem>
                      <SelectItem value="2-3">Low-Medium (2-3)</SelectItem>
                      <SelectItem value="3-4">Medium (3-4)</SelectItem>
                      <SelectItem value="4-5">Medium-High (4-5)</SelectItem>
                      <SelectItem value="5-5">High (5)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : rule.field === 'interactivityLevel' ? (
                  <Select
                    value={rule.value}
                    onValueChange={(value) => updateFilterRule(index, 'value', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={rule.value}
                    onChange={(e) => updateFilterRule(index, 'value', e.target.value)}
                    placeholder="Filter value"
                  />
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => removeFilterRule(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={addFilterRule}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Filter Rule
          </Button>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Live Preview
                <Badge variant="secondary">
                  {matchingShows.length} shows match
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchingShows.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                  {matchingShows.slice(0, 20).map(show => (
                    <div key={show.id} className="text-xs border rounded p-2">
                      <div className="font-medium truncate">{show.name}</div>
                      <div className="text-muted-foreground">
                        Stim: {(show as any).stimulation_score || show.stimulationScore}/5
                      </div>
                      {show.themes && (
                        <div className="text-muted-foreground truncate">
                          {show.themes.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  {matchingShows.length > 20 && (
                    <div className="text-xs text-muted-foreground p-2">
                      ...and {matchingShows.length - 20} more
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No shows match the current filter configuration.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Category' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
}