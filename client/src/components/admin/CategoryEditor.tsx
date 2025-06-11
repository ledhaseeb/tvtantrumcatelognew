import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ShowFilters from '@/components/ShowFilters';
import ShowCard from '@/components/ShowCard';
import { useQuery } from '@tanstack/react-query';
import type { TvShow, HomepageCategory, InsertHomepageCategory } from '@shared/catalog-schema';

interface CategoryEditorProps {
  category?: HomepageCategory;
  onSubmit: (data: InsertHomepageCategory) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FiltersType {
  ageGroup?: string;
  ageRange?: {min: number, max: number};
  tantrumFactor?: string;
  sortBy?: string;
  search?: string;
  themes?: string[];
  themeMatchMode?: 'AND' | 'OR';
  interactionLevel?: string;
  stimulationScoreRange?: {min: number, max: number};
}

export default function CategoryEditor({ category, onSubmit, onCancel, isLoading = false }: CategoryEditorProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.isActive !== false);
  const [activeFilters, setActiveFilters] = useState<FiltersType>({});
  const [previewShows, setPreviewShows] = useState<TvShow[]>([]);

  // Convert existing filter config to filters format
  useEffect(() => {
    if (category?.filterConfig) {
      const convertedFilters = convertFilterConfigToFilters(category.filterConfig);
      setActiveFilters(convertedFilters);
    }
  }, [category]);

  // Fetch shows based on current filters for live preview
  const { data: shows = [], isLoading: showsLoading } = useQuery({
    queryKey: ['/api/tv-shows', activeFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.ageGroup) params.append('ageGroup', activeFilters.ageGroup);
      if (activeFilters.tantrumFactor) params.append('tantrumFactor', activeFilters.tantrumFactor);
      if (activeFilters.sortBy) params.append('sortBy', activeFilters.sortBy);
      if (activeFilters.interactionLevel) params.append('interactionLevel', activeFilters.interactionLevel);
      
      if (activeFilters.themes && activeFilters.themes.length > 0) {
        activeFilters.themes.forEach(theme => params.append('themes', theme));
      }
      if (activeFilters.themeMatchMode) params.append('themeMatchMode', activeFilters.themeMatchMode);
      
      if (activeFilters.stimulationScoreRange) {
        params.append('stimulationScoreRange', JSON.stringify(activeFilters.stimulationScoreRange));
      }
      
      const response = await fetch(`/api/tv-shows?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json();
    },
    enabled: Object.keys(activeFilters).length > 0
  });

  // Update preview shows when data changes
  useEffect(() => {
    setPreviewShows(shows);
  }, [shows]);

  const convertFilterConfigToFilters = (filterConfig: any): FiltersType => {
    const filters: FiltersType = {};
    
    if (!filterConfig.rules || !Array.isArray(filterConfig.rules)) {
      return filters;
    }

    // Handle theme matching mode
    if (filterConfig.logic) {
      filters.themeMatchMode = filterConfig.logic;
    }

    for (const rule of filterConfig.rules) {
      switch (rule.field) {
        case 'stimulationScore':
          if (rule.operator === 'range' && rule.value) {
            if (typeof rule.value === 'string') {
              const parts = rule.value.split('-');
              if (parts.length === 2) {
                filters.stimulationScoreRange = {
                  min: parseInt(parts[0]),
                  max: parseInt(parts[1])
                };
              }
            }
          }
          break;
        case 'themes':
          if (rule.operator === 'contains' && rule.value) {
            if (!filters.themes) filters.themes = [];
            filters.themes.push(rule.value);
          }
          break;
        case 'ageRange':
          if (rule.operator === 'range' && rule.value) {
            if (typeof rule.value === 'string') {
              const parts = rule.value.split('-');
              if (parts.length === 2) {
                filters.ageRange = {
                  min: parseInt(parts[0]),
                  max: parseInt(parts[1])
                };
              }
            }
          }
          break;
        case 'ageGroup':
          if (rule.operator === 'equals' && rule.value) {
            filters.ageGroup = rule.value;
          }
          break;
        case 'interactionLevel':
          if (rule.operator === 'equals' && rule.value) {
            filters.interactionLevel = rule.value;
          }
          break;
      }
    }

    return filters;
  };

  const convertFiltersToFilterConfig = (filters: FiltersType): any => {
    const rules: any[] = [];
    
    if (filters.stimulationScoreRange) {
      rules.push({
        field: 'stimulationScore',
        operator: 'range',
        value: `${filters.stimulationScoreRange.min}-${filters.stimulationScoreRange.max}`
      });
    }

    if (filters.themes && filters.themes.length > 0) {
      filters.themes.forEach(theme => {
        rules.push({
          field: 'themes',
          operator: 'contains',
          value: theme
        });
      });
    }

    if (filters.ageRange) {
      rules.push({
        field: 'ageRange',
        operator: 'range',
        value: `${filters.ageRange.min}-${filters.ageRange.max}`
      });
    }

    if (filters.ageGroup) {
      rules.push({
        field: 'ageGroup',
        operator: 'equals',
        value: filters.ageGroup
      });
    }

    if (filters.interactionLevel) {
      rules.push({
        field: 'interactionLevel',
        operator: 'equals',
        value: filters.interactionLevel
      });
    }

    return {
      logic: filters.themeMatchMode || 'OR',
      rules
    };
  };

  const handleFilterChange = (newFilters: FiltersType) => {
    setActiveFilters(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filterConfig = convertFiltersToFilterConfig(activeFilters);
    const categoryData: InsertHomepageCategory = {
      name,
      description,
      isActive,
      filterConfig,
      displayOrder: category?.displayOrder || 0
    };

    onSubmit(categoryData);
  };

  const hasFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Active (visible on homepage)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Filter Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure which shows should appear in this category
            </p>
          </CardHeader>
          <CardContent>
            <ShowFilters
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Live Preview
              <Badge variant="outline">
                {showsLoading ? 'Loading...' : `${previewShows.length} shows`}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Shows that match your current filter configuration
            </p>
          </CardHeader>
          <CardContent>
            {!hasFilters ? (
              <div className="text-center py-8 text-muted-foreground">
                Configure filters above to see matching shows
              </div>
            ) : showsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : previewShows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No shows match the current filters
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {previewShows.slice(0, 12).map((show) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    viewMode="grid"
                    onClick={() => {}}
                  />
                ))}
                {previewShows.length > 12 && (
                  <div className="col-span-full text-center text-sm text-muted-foreground mt-4">
                    And {previewShows.length - 12} more shows...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}