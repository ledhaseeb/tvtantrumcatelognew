import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, FileText, Loader2, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/FileUploader';

// Define the schema for research entry
const researchFormSchema = z.object({
  title: z.string().min(3, {
    message: 'Research title must be at least 3 characters.',
  }),
  category: z.string({
    required_error: 'Please select a category.',
  }),
  source: z.string().optional(),
  originalUrl: z.string().url({
    message: 'Please enter a valid URL for the original study.',
  }).optional(),
  publishedDate: z.string().optional(),
  summary: z.string().optional(),
  fullText: z.string().optional(),
  headline: z.string().optional(),
  subHeadline: z.string().optional(),
  keyFindings: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ResearchFormValues = z.infer<typeof researchFormSchema>;

export default function AdminResearchManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Default values for form
  const defaultValues: Partial<ResearchFormValues> = {
    title: '',
    category: '',
    source: '',
    originalUrl: '',
    publishedDate: '',
    summary: '',
    fullText: '',
    headline: '',
    subHeadline: '',
    keyFindings: '',
    imageUrl: '',
  };

  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchFormSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  // Check if we're in edit mode by checking localStorage
  useEffect(() => {
    console.log("Current location: ", location);
    
    // Get the edit ID from localStorage if it exists
    const storedEditId = localStorage.getItem('editResearchId');
    console.log("Stored edit ID from localStorage: ", storedEditId);
    
    if (storedEditId) {
      const id = parseInt(storedEditId, 10);
      console.log("Parsed ID: ", id);
      
      if (!isNaN(id)) {
        console.log("Setting edit mode for ID: ", id);
        setIsEditMode(true);
        setEditId(id);
        fetchResearchEntry(id);
        
        // Clear the localStorage item after we've used it
        localStorage.removeItem('editResearchId');
      }
    }
    // Also check URL parameters for backward compatibility
    else if (location.includes('?')) {
      const searchParams = new URLSearchParams(location.split('?')[1]);
      const editParam = searchParams.get('edit');
      
      console.log("Edit parameter from URL: ", editParam);
      
      if (editParam) {
        const id = parseInt(editParam, 10);
        if (!isNaN(id)) {
          console.log("Setting edit mode for ID from URL: ", id);
          setIsEditMode(true);
          setEditId(id);
          fetchResearchEntry(id);
        }
      }
    }
  }, [location]);
  
  // Fetch research entry data for editing
  const fetchResearchEntry = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/research/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch research entry');
      }
      
      const data = await response.json();
      console.log('Fetched research entry:', data);
      
      // Make sure we have a valid date format for the published date field
      let formattedDate = '';
      if (data.publishedDate) {
        try {
          // If it's a valid date string, format it as YYYY-MM-DD for the input field
          const date = new Date(data.publishedDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      // Pre-fill the form with the fetched data - ensure all fields are properly populated
      const formData = {
        title: data.title || '',
        category: data.category || '',
        source: data.source || '',
        originalUrl: data.originalUrl || '',
        publishedDate: formattedDate,
        summary: data.summary || '',
        fullText: data.fullText || '',
        headline: data.headline || '',
        subHeadline: data.subHeadline || '',
        keyFindings: data.keyFindings || '',
        imageUrl: data.imageUrl || ''
      };
      
      console.log('Setting form data:', formData);
      
      // Update form values and trigger validation
      form.reset(formData);
      
      // Set each field value individually to ensure the form is updated
      Object.entries(formData).forEach(([key, value]) => {
        form.setValue(key as keyof ResearchFormValues, value);
      });
      
      // If there's an image URL, set it in state
      if (data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
      }
      
      toast({
        title: 'Research entry loaded',
        description: 'You are now editing an existing research entry.',
      });
    } catch (error) {
      console.error('Error fetching research entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to load research entry data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const { mutate: submitResearch, isPending } = useMutation({
    mutationFn: async (data: ResearchFormValues) => {
      // Include the uploaded image URL if available
      if (uploadedImageUrl) {
        data.imageUrl = uploadedImageUrl;
      }
      
      let url = '/api/research';
      let method = 'POST';
      
      // If in edit mode, use PATCH method with the edit ID
      if (isEditMode && editId) {
        url = `/api/research/${editId}`;
        method = 'PATCH';
      }
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} research entry:`, data);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} research entry`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? 'Research updated' : 'Research created',
        description: `The research entry has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
      // Invalidate research query cache
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      // Navigate back to admin dashboard
      setLocation('/admin');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(data: ResearchFormValues) {
    submitResearch(data);
  }

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setUploadedImageUrl(url);
    form.setValue('imageUrl', url);
  };

  const researchCategories = [
    'Screen Time',
    'Cognitive Development',
    'Learning Outcomes',
    'Parental Guidance',
    'Media Effects',
    'Content Analysis',
    'Child Psychology',
    'Educational Impact',
    'Social Development',
    'Digital Literacy',
    'Other'
  ];

  return (
    <main className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={() => setLocation('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardTitle>Add Research Summary</CardTitle>
          <CardDescription>
            Create a new research summary to share insights with your audience
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Research Details</CardTitle>
              <CardDescription>
                Enter the details of the research summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Research title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {researchCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Research source (e.g., Journal name, University)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publishedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Published Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              placeholder="YYYY-MM-DD"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="originalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Study URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/research-study"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Direct link to the original study or research paper
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Main headline for the research"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-headline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Supporting subheadline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief summary of the research findings"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keyFindings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Bullet-point list of key findings (separate with new lines)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter each key finding on a new line. They will be formatted as bullet points.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Complete text of the research summary (separate paragraphs with new lines)"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter each paragraph on a separate line. Your text will be properly formatted when displayed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="flex justify-end px-0 pb-0">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Research
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Upload an image to accompany the research summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                onUploadComplete={handleImageUpload}
                onUploadStart={() => setIsUploading(true)}
                onUploadError={(error) => {
                  setIsUploading(false);
                  toast({
                    title: 'Upload failed',
                    description: error,
                    variant: 'destructive',
                  });
                }}
                folder="research-images"
              />
              {uploadedImageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded preview"
                    className="rounded-md w-full max-h-[200px] object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Tips for Research Entries</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 text-sm space-y-1">
                    <li>Fields marked with * are required</li>
                    <li>Use clear, descriptive titles that explain the research</li>
                    <li>Include original study links when available</li>
                    <li>Format key findings as short, actionable insights</li>
                    <li>Choose relevant categories to help users find content</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}