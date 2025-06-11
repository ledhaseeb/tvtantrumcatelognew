import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, BookOpen, Calendar, ExternalLink, FileText, Award } from 'lucide-react';
import AdContainer from '@/components/AdContainer';

const ResearchDetail = () => {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [research, setResearch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Direct fetch approach with proper authentication
  useEffect(() => {
    async function fetchResearch() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/research/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch research');
        }
        
        const data = await response.json();
        setResearch(data);
      } catch (error) {
        console.error('Error fetching research:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResearch();
  }, [id]);

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/research/${id}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark research as read');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the local research state to show it's been read
      if (research) {
        setResearch({
          ...research,
          hasRead: true
        });
      }
      
      // Show success toast
      toast({
        title: "Research marked as read",
        description: "You've earned 5 points!",
        variant: "default",
      });
      
      // Invalidate queries to update UI across the app
      queryClient.invalidateQueries({ queryKey: [`/api/research/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark research as read. Please try again.",
        variant: "destructive",
      });
    }
  });

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

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return 'General';
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Skip auth loading check for faster rendering
  // We'll show sign in prompt only after confirmed no user is present

  if (isLoading) {
    return (
      <div className="container max-w-[1100px] py-8 px-6 md:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
          <Skeleton className="h-10 w-[300px]" />
          <div className="flex gap-2 my-4">
            <Skeleton className="h-6 w-[100px]" />
            <Skeleton className="h-6 w-[100px]" />
          </div>
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/research">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Research
            </Link>
          </Button>
        </div>
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Research Not Found</CardTitle>
            <CardDescription>
              The research summary you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/research">Browse All Research</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleMarkAsRead = () => {
    if (!research.hasRead) {
      markAsReadMutation.mutate();
    }
  };

  // Show loading while fetching research data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading research...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/research">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Research
          </Link>
        </Button>
      </div>

      {/* Top Ad Container */}
      <div className="mb-8">
        <AdContainer size="leaderboard" className="mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 px-4">
          <div className="mb-6">
            {research.category && (
              <Badge variant="outline" className="mb-2">
                {formatCategoryName(research.category)}
              </Badge>
            )}
            <h1 className="text-3xl font-bold mb-3">{research.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              {research.publishedDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(research.publishedDate)}</span>
                </div>
              )}
              {research.source && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>{research.source}</span>
                </div>
              )}
            </div>

            {user && research.hasRead ? (
              <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                <BookOpen className="w-3 h-3 mr-1" /> Read
              </Badge>
            ) : user ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
                <Award className="w-3 h-3 mr-1" /> Earn 5 points by reading
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <BookOpen className="w-3 h-3 mr-1" /> Free research access
              </Badge>
            )}
          </div>

          <div className="prose prose-p:text-base prose-headings:font-semibold max-w-none">
            {/* Display headline and sub-headline if available */}
            {(research.headline || research.subHeadline) && (
              <div className="mb-8">
                {research.headline && (
                  <h2 className="text-2xl font-bold mb-2">{research.headline}</h2>
                )}
                {research.subHeadline && (
                  <h3 className="text-xl text-gray-700 mb-4">{research.subHeadline}</h3>
                )}
              </div>
            )}
            
            {/* Display summary first */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Summary</h3>
              <p>{research.summary}</p>
            </div>
            
            {/* Display key findings if available */}
            {research.keyFindings && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Key Findings</h3>
                <div className="space-y-2">
                  {(() => {
                    // Process key findings with proper spacing
                    const processedFindings = [];
                    const sections = research.keyFindings.split('\n\n');
                    
                    sections.forEach((section, sectionIndex) => {
                      const lines = section.split('\n').filter(line => line.trim() !== '');
                      
                      lines.forEach((line, lineIndex) => {
                        if (lineIndex === 0 && line.includes(':')) {
                          // This is a heading with a colon - create a section with content
                          const [heading, ...content] = lines;
                          const headingText = heading.split(':')[0];
                          const remainingText = heading.split(':').slice(1).join(':').trim();
                          
                          processedFindings.push(
                            <div key={`section-${sectionIndex}`} className="mb-4">
                              <p>
                                <span className="font-bold">{headingText}:</span>
                                {remainingText}
                              </p>
                              {content.map((contentLine, contentIndex) => (
                                <p key={`content-${sectionIndex}-${contentIndex}`} className="mt-1">
                                  {contentLine.includes(':') ? (
                                    <>
                                      <span className="font-bold">{contentLine.split(':')[0]}:</span>
                                      {contentLine.split(':').slice(1).join(':')}
                                    </>
                                  ) : (
                                    contentLine
                                  )}
                                </p>
                              ))}
                            </div>
                          );
                          return;
                        }
                        
                        // Handle standalone lines
                        if (lines.length === 1) {
                          processedFindings.push(
                            <div key={`line-${sectionIndex}`} className="mb-2">
                              <p>
                                {line.includes(':') ? (
                                  <>
                                    <span className="font-bold">{line.split(':')[0]}:</span>
                                    {line.split(':').slice(1).join(':')}
                                  </>
                                ) : (
                                  line
                                )}
                              </p>
                            </div>
                          );
                        }
                      });
                    });
                    
                    return processedFindings;
                  })()}
                </div>
              </div>
            )}

            {/* Middle Ad Container */}
            <div className="my-8">
              <AdContainer size="rectangle" className="mx-auto" />
            </div>

            {/* Display image between Key Findings and Detail sections */}
            {research.imageUrl && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={research.imageUrl}
                  alt={research.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Display full text if available */}
            {research.fullText && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Detail</h3>
                {research.fullText.split('\n\n').map((paragraph, index) => (
                  <p key={index}>
                    {paragraph.includes(':') ? (
                      <>
                        <span className="font-bold">{paragraph.split(':')[0]}:</span>
                        {paragraph.split(':').slice(1).join(':')}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            )}

            {/* Bottom Ad Container */}
            <div className="mt-8 mb-6">
              <AdContainer size="rectangle" className="mx-auto" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 px-4">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {research.source && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Source</h4>
                    <p className="text-sm text-gray-600">{research.source}</p>
                  </div>
                )}
                
                {research.publishedDate && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Published</h4>
                    <p className="text-sm text-gray-600">{formatDate(research.publishedDate)}</p>
                  </div>
                )}

                {research.category && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Category</h4>
                    <p className="text-sm text-gray-600">{formatCategoryName(research.category)}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">Original Research</h4>
                  <a 
                    href={research.originalStudyUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(research.title + " " + (research.source || ""))}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> 
                    Read the full study
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    {research.originalStudyUrl ? "Opens original paper" : "Opens in Google Scholar"}
                  </p>
                </div>

                <Separator />

                <div className="pt-2">
                  {research.hasRead ? (
                    <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                      <div className="flex items-center font-medium">
                        <BookOpen className="w-4 h-4 mr-2" />
                        You've read this research
                      </div>
                      <p className="text-green-600 text-xs mt-1">+5 points have been added to your account</p>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleMarkAsRead} 
                      className="w-full"
                      disabled={markAsReadMutation.isPending}
                    >
                      {markAsReadMutation.isPending ? 'Marking as read...' : 'Mark as Read'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDetail;