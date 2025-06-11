import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Search } from "lucide-react";

const linkUpdateSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type ResearchSummary = {
  id: number;
  title: string;
  summary: string;
  category: string;
  originalUrl?: string;
};

const AdminResearchLinks = () => {
  const [selectedResearch, setSelectedResearch] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: researchList, isLoading: isLoadingResearch } = useQuery<ResearchSummary[]>({
    queryKey: ["/api/research"],
  });

  const form = useForm({
    resolver: zodResolver(linkUpdateSchema),
    defaultValues: {
      url: "",
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: async (data: { id: number; url: string }) => {
      const response = await fetch(`/api/research/${data.id}/update-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl: data.url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update research link");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({
        title: "Link updated",
        description: "The research link has been updated successfully",
      });
      form.reset();
      setSelectedResearch(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update the research link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof linkUpdateSchema>) => {
    if (selectedResearch) {
      updateResearchMutation.mutate({ id: selectedResearch, url: data.url });
    }
  };

  const handleSelect = (id: number) => {
    setSelectedResearch(id);
    // Find if research already has a link
    const research = researchList?.find((r) => r.id === id);
    if (research?.originalUrl) {
      form.setValue("url", research.originalUrl);
    } else {
      form.reset();
    }
  };

  const filteredResearch = researchList?.filter(research => 
    searchTerm === "" || 
    research.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    research.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold mb-2">Research Original Links</h1>
        <p className="text-gray-600 mb-6">
          Update the original source links for research articles. These links should point to the actual published papers.
        </p>
        
        <div className="relative w-full max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Research Articles</CardTitle>
              <CardDescription>
                Select a research article to update its original source link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResearch ? (
                <div className="p-8 text-center">Loading research articles...</div>
              ) : (
                <div className="space-y-4">
                  {filteredResearch?.map((research) => (
                    <div 
                      key={research.id} 
                      className={`p-4 border rounded-md cursor-pointer ${
                        selectedResearch === research.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => handleSelect(research.id)}
                    >
                      <div className="font-medium">{research.title}</div>
                      <div className="text-sm text-gray-500 mt-1">Category: {research.category}</div>
                      {research.originalUrl && (
                        <div className="text-xs text-green-600 mt-2 flex items-center">
                          <ExternalLink size={12} className="mr-1" />
                          Has link: {research.originalUrl}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredResearch?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No research articles match your search.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Link</CardTitle>
              <CardDescription>
                {selectedResearch 
                  ? "Enter the original research URL" 
                  : "Select a research article first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Research URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://..." 
                            disabled={!selectedResearch}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={!selectedResearch || updateResearchMutation.isPending}
                    className="w-full"
                  >
                    {updateResearchMutation.isPending ? "Updating..." : "Update Link"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminResearchLinks;