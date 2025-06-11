import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Edit, 
  Trash2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResearchSummary {
  id: number;
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
  createdAt: string;
  updatedAt: string;
}

interface ResearchTableProps {
  onEdit: (research: ResearchSummary) => void;
}

export function ResearchTable({ onEdit }: ResearchTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: research = [], isLoading } = useQuery({
    queryKey: ['/api/admin/research'],
    queryFn: async () => {
      const response = await fetch('/api/admin/research', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch research');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/research/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete research');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/research'] });
      toast({
        title: "Success",
        description: "Research deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete research",
        variant: "destructive",
      });
    },
  });

  const filteredResearch = research.filter((item: ResearchSummary) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Learning Outcomes': 'bg-blue-100 text-blue-800',
      'Cognitive Development': 'bg-purple-100 text-purple-800',
      'Parental Guidance': 'bg-green-100 text-green-800',
      'Media Effects': 'bg-orange-100 text-orange-800',
      'Screen Time': 'bg-red-100 text-red-800',
      'Educational Technology': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search research..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading research...
                </TableCell>
              </TableRow>
            ) : filteredResearch.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No research found
                </TableCell>
              </TableRow>
            ) : (
              filteredResearch.map((item: ResearchSummary) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate">{item.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>{formatDate(item.publishedDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {item.originalStudyUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.originalStudyUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}