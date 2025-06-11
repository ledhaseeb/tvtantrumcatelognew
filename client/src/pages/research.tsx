import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { BookOpen, BookText, ArrowRight, Lock } from 'lucide-react';
import AdContainer from '@/components/AdContainer';

const Research = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  // Using Link component for navigation instead of useLocation

  const { data: summaries, isLoading: isLoadingSummaries, error } = useQuery({
    queryKey: ['/api/research'],
    queryFn: async () => {
      const response = await fetch('/api/research', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: true, // Always fetch research data for all users
    staleTime: 0, // Always fetch fresh data to show read status updates
  });



  // Define categories based on actual database categories
  const categories = [
    { id: 'all', name: 'All Research' },
    { id: 'Child Psychology', name: 'Child Psychology' },
    { id: 'Cognitive Development', name: 'Cognitive Development' },
    { id: 'Learning Outcomes', name: 'Learning Outcomes' },
    { id: 'Media Effects', name: 'Media Effects' },
    { id: 'Parental Guidance', name: 'Parental Guidance' },
    { id: 'Social Development', name: 'Social Development' },
  ];

  // Show loading while fetching research data
  if (isLoadingSummaries) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <div className="flex gap-2 overflow-x-auto py-2">
            {categories.map((_, i) => (
              <Skeleton key={i} className="h-8 w-[120px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group research by category
  const categorizedSummaries = summaries && Array.isArray(summaries) ? summaries.reduce((acc: Record<string, any[]>, summary: any) => {
    const categoryId = summary.category || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(summary);
    return acc;
  }, {} as Record<string, any[]>) : {};

  // Count items per category
  const categoryCounts: Record<string, number> = {};
  if (summaries && Array.isArray(summaries)) {
    categories.forEach(category => {
      if (category.id === 'all') {
        categoryCounts[category.id] = summaries.length;
      } else {
        categoryCounts[category.id] = categorizedSummaries[category.id]?.length || 0;
      }
    });
  }

  // Get all unique categories from the data
  const dataCategories = new Set(
    summaries && Array.isArray(summaries) 
      ? summaries.map((summary: any) => summary.category || 'uncategorized')
      : []
  );

  // Filter summaries based on active category
  const filteredSummaries = activeCategory === 'all'
    ? (summaries || [])
    : (categorizedSummaries[activeCategory] || []);

  const handleReadMore = (summaryId: number) => {
    // Use window.location instead of navigate for consistent navigation approach
    window.location.href = `/research/${summaryId}`;
  };

  return (
    <div className="container max-w-[1100px] py-8 px-6 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research Summaries</h1>
          <p className="text-gray-500">
            Discover the latest research on children's media and development
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
          <BookOpen className="w-3 h-3 mr-1" /> 
          {user ? 'Earn 5 points for each summary you read' : 'Free access to research summaries'}
        </Badge>
      </div>

      {/* Top Ad Container */}
      <div className="mb-8">
        <AdContainer size="leaderboard" className="mx-auto" />
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="block md:hidden mb-8">
        <Select value={activeCategory} onValueChange={setActiveCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category">
              {categories.find(cat => cat.id === activeCategory)?.name}
              {categoryCounts && categoryCounts[activeCategory] > 0 && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {categoryCounts[activeCategory]}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{category.name}</span>
                  {categoryCounts && categoryCounts[category.id] > 0 && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                      {categoryCounts[category.id]}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tab interface */}
      <Tabs 
        defaultValue="all" 
        value={activeCategory} 
        onValueChange={setActiveCategory} 
        className="hidden md:block mb-14"
      >
        <TabsList className="flex flex-wrap mb-10 px-1 justify-center gap-2">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id}
              value={category.id}
              className={`flex flex-col items-center py-2 px-3 ${category.id === 'all' ? 'min-w-[100px]' : 'min-w-[150px]'} h-auto`}
            >
              <span className="text-center">
                {category.id === 'all' ? category.name : 
                  category.name.split(' and ').map((part, i) => (
                    <span key={i} className="block">
                      {part}{i < category.name.split(' and ').length - 1 && ' &'}
                    </span>
                  ))
                }
              </span>
              {categoryCounts && categoryCounts[category.id] > 0 && 
                <span className="mt-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {categoryCounts[category.id]}
                </span>
              }
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content display for both mobile and desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingSummaries ? (
          // Loading placeholder for research cards
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="h-[280px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-full mb-1" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="pb-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </>
        ) : activeCategory === 'all' ? (
          summaries && Array.isArray(summaries) ? summaries.map((summary: any, index: number) => (
            <React.Fragment key={summary.id}>
              <ResearchCard summary={summary} onReadMore={handleReadMore} />
              {/* Middle Ad Container after every 6 research cards */}
              {(index + 1) % 6 === 0 && (
                <div className="col-span-full my-6">
                  <AdContainer size="rectangle" className="mx-auto" />
                </div>
              )}
            </React.Fragment>
          )) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <BookText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No research summaries available</p>
            </div>
          )
        ) : (
          categorizedSummaries[activeCategory] && Array.isArray(categorizedSummaries[activeCategory]) 
            ? categorizedSummaries[activeCategory].map((summary: any, index: number) => (
                <React.Fragment key={summary.id}>
                  <ResearchCard summary={summary} onReadMore={handleReadMore} />
                  {/* Middle Ad Container after every 6 research cards */}
                  {(index + 1) % 6 === 0 && (
                    <div className="col-span-full my-6">
                      <AdContainer size="rectangle" className="mx-auto" />
                    </div>
                  )}
                </React.Fragment>
              ))
            : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BookText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No research summaries found in this category</p>
              </div>
            )
        )}
      </div>

      {/* Bottom Ad Container */}
      <div className="mt-12 mb-6">
        <AdContainer size="leaderboard" className="mx-auto" />
      </div>
    </div>
  );
};

interface ResearchCardProps {
  summary: any;
  onReadMore: (id: number) => void;
}

const ResearchCard = ({ summary, onReadMore }: ResearchCardProps) => {
  // Debug: Log the summary data to see if hasRead is being passed
  console.log('ResearchCard summary:', summary.id, summary.title, 'hasRead:', summary.hasRead);
  
  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return 'General';
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className={`h-full flex flex-col ${summary.hasRead ? 'bg-gray-50 border-gray-200' : ''}`}>
      {summary.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img 
            src={summary.imageUrl} 
            alt={summary.title}
            className={`w-full h-full object-contain bg-gray-50 transition-transform hover:scale-105 ${summary.hasRead ? 'opacity-75' : ''}`}
          />
          {summary.hasRead && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 text-white border-green-600 shadow-sm">
                ✓ Read
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="mb-2">
            {formatCategoryName(summary.category)}
          </Badge>
          {summary.hasRead && !summary.imageUrl && (
            <Badge className="bg-green-500 text-white border-green-600">
              ✓ Read
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{summary.title}</CardTitle>
        {summary.publishedDate && (
          <CardDescription className="mt-1 text-sm text-gray-500">
            {formatDate(summary.publishedDate)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-500 line-clamp-3">
          {summary.summary}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between"
          onClick={() => onReadMore(summary.id)}
        >
          <span>Read More</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Research;