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
  Star,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TvShow {
  id: number;
  name: string;
  age_range?: string;
  ageRange?: string;
  stimulation_score?: number;
  stimulationScore?: number;
  is_featured?: boolean;
  isFeatured?: boolean;
  has_omdb_data?: boolean;
  hasOmdbData?: boolean;
  has_youtube_data?: boolean;
  hasYoutubeData?: boolean;
}

interface FullTvShow {
  id: number;
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
  isFeatured: boolean;
  hasOmdbData: boolean;
  hasYoutubeData: boolean;
}

interface TvShowsTableProps {
  onEdit: (show: FullTvShow) => void;
}

export function TvShowsTable({ onEdit }: TvShowsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch TV shows
  const { data: shows = [], isLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/tv-shows', { search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/tv-shows?${params}`);
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json();
    },
  });

  // Set featured show mutation
  const setFeaturedMutation = useMutation({
    mutationFn: async (showId: number) => {
      const response = await fetch(`/api/admin/shows/${showId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to set featured show');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tv-shows'] });
      toast({
        title: "Success",
        description: "Featured show updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update featured show",
        variant: "destructive",
      });
    },
  });

  // Handle edit with full data fetch
  const handleEdit = async (showId: number) => {
    try {
      const response = await fetch(`/api/admin/tv-shows/${showId}`);
      if (!response.ok) throw new Error('Failed to fetch show details');
      const rawShow = await response.json();
      
      // Transform database column names to frontend format
      const fullShow: FullTvShow = {
        id: rawShow.id,
        name: rawShow.name || "",
        description: rawShow.description || "",
        ageRange: rawShow.age_range || rawShow.ageRange || "",
        stimulationScore: rawShow.stimulation_score || rawShow.stimulationScore || 1,
        interactivityLevel: rawShow.interactivity_level || rawShow.interactivityLevel,
        dialogueIntensity: rawShow.dialogue_intensity || rawShow.dialogueIntensity,
        soundEffectsLevel: rawShow.sound_effects_level || rawShow.soundEffectsLevel,
        totalMusicLevel: rawShow.total_music_level || rawShow.totalMusicLevel,
        sceneFrequency: rawShow.scene_frequency || rawShow.sceneFrequency,
        musicTempo: rawShow.music_tempo || rawShow.musicTempo,
        themes: rawShow.themes || [],
        animationStyle: rawShow.animation_style || rawShow.animationStyle,
        imageUrl: rawShow.image_url || rawShow.imageUrl,
        creator: rawShow.creator,
        releaseYear: rawShow.release_year || rawShow.releaseYear,
        episodeLength: rawShow.episode_length || rawShow.episodeLength,
        seasons: rawShow.seasons,
        isFeatured: rawShow.is_featured || rawShow.isFeatured || false,
        hasOmdbData: rawShow.has_omdb_data || rawShow.hasOmdbData || false,
        hasYoutubeData: rawShow.has_youtube_data || rawShow.hasYoutubeData || false
      };
      
      onEdit(fullShow);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load show details for editing",
        variant: "destructive",
      });
    }
  };

  const filteredShows = shows.filter(show =>
    show.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shows..."
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
              <TableHead>Name</TableHead>
              <TableHead>Age Range</TableHead>
              <TableHead>Stimulation</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>OMDb</TableHead>
              <TableHead>YouTube</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading shows...
                </TableCell>
              </TableRow>
            ) : filteredShows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No shows found
                </TableCell>
              </TableRow>
            ) : (
              filteredShows.map((show) => (
                <TableRow key={show.id}>
                  <TableCell>{show.id}</TableCell>
                  <TableCell className="font-medium">{show.name}</TableCell>
                  <TableCell>{show.age_range || show.ageRange || 'N/A'}</TableCell>
                  <TableCell>{(show.stimulation_score || show.stimulationScore || 0)}/5</TableCell>
                  <TableCell>
                    <Button
                      variant={(show.is_featured || show.isFeatured) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeaturedMutation.mutate(show.id)}
                      disabled={setFeaturedMutation.isPending}
                    >
                      <Star className={`h-4 w-4 mr-1 ${(show.is_featured || show.isFeatured) ? 'fill-current' : ''}`} />
                      {(show.is_featured || show.isFeatured) ? 'Featured' : 'Set Featured'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {(show.has_omdb_data || show.hasOmdbData) ? (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <X className="h-3 w-3 mr-1" />
                        -
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(show.has_youtube_data || show.hasYoutubeData) ? (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <X className="h-3 w-3 mr-1" />
                        -
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(show.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
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