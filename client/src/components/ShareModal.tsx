import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Copy, Smartphone, Square, Zap, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    id: number;
    name: string;
    description: string;
    stimulationScore?: number;
    imageUrl?: string;
    ageRange?: string;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, show }) => {
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square'>('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const shareContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getStimulationLabel = (score: number) => {
    switch (score) {
      case 1: return 'Low';
      case 2: return 'Low-Medium';
      case 3: return 'Medium';
      case 4: return 'Medium-High';
      case 5: return 'High';
      default: return 'Unknown';
    }
  };

  const getStimulationDescription = (score: number) => {
    switch (score) {
      case 1: return 'Gentle pacing with minimal scene changes. Typically contains softer sounds and music. Calm dialogue and predictable content. Ideal for very young children, bedtime viewing, or children sensitive to stimulation.';
      case 2: return 'Balanced pacing with occasional transitions. Typically contains mild sound effects and harmonious music. Engaging but not overwhelming content. Recommended for those longer viewing sessions and younger children.';
      case 3: return 'Moderate pacing with regular scene changes. Typically contains moderate sound effects and varied music. Mix of calm and exciting moments. Suitable for most but monitor younger viewers for signs of overstimulation.';
      case 4: return 'Fast-paced with frequent scene changes. Prominent sound effects and dynamic music. Energetic dialogue and action. Better shorter viewing sessions. May feel intense to sensitive or younger viewers.';
      case 5: return 'Rapid pacing with very quick scene changes. Typically contains intense sound effect usage and fast music. Highly energetic content with many elements competing for attention. Use with caution.';
      default: return 'Stimulation level not available';
    }
  };

  const getStimulationBadgeColor = (score: number): string => {
    switch (score) {
      case 1: return 'bg-green-500 text-white';
      case 2: return 'bg-green-500 text-white';
      case 3: return 'bg-yellow-500 text-black';
      case 4: return 'bg-orange-500 text-white';
      case 5: return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const renderStimulationDots = (score: number) => {
    const getColorForIndex = (index: number, score: number) => {
      if (index >= score) return 'bg-gray-300';
      
      // Color progression based on your grading system
      switch (index) {
        case 0: return 'bg-green-500'; // First dot always green
        case 1: return 'bg-green-500'; // Second dot green for scores 2+
        case 2: return score >= 3 ? 'bg-yellow-500' : 'bg-gray-300'; // Third dot yellow for scores 3+
        case 3: return score >= 4 ? 'bg-orange-500' : 'bg-gray-300'; // Fourth dot orange for scores 4+
        case 4: return score >= 5 ? 'bg-red-500' : 'bg-gray-300'; // Fifth dot red for score 5
        default: return 'bg-gray-300';
      }
    };

    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full ${getColorForIndex(i, score)}`}
      />
    ));
  };

  const generateImage = async () => {
    if (!shareContentRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${show.name.replace(/[^a-zA-Z0-9]/g, '_')}_tvtantrum_${aspectRatio}.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Image Downloaded",
            description: `${show.name} share image saved successfully!`,
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate share image. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    if (!shareContentRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast({
              title: "Copied to Clipboard",
              description: "Share image copied successfully!",
            });
          } catch (err) {
            // Fallback for browsers that don't support clipboard API
            toast({
              title: "Use Download Instead",
              description: "Your browser doesn't support copying images. Use the download button instead.",
              variant: "destructive",
            });
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error copying image:', error);
      toast({
        title: "Error",
        description: "Failed to copy image. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share {show.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aspect Ratio Controls */}
          <div className="flex gap-2">
            <Button
              variant={aspectRatio === 'square' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspectRatio('square')}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Square Post
            </Button>
            <Button
              variant={aspectRatio === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspectRatio('portrait')}
              className="flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Story Format
            </Button>
          </div>

          {/* Shareable Content */}
          <div className="flex justify-center">
            <div
              ref={shareContentRef}
              className={`bg-white border-2 border-gray-200 rounded-xl overflow-hidden ${
                aspectRatio === 'portrait' 
                  ? 'w-80 h-[480px]' // 9:16 aspect ratio
                  : 'w-96 h-96' // 1:1 aspect ratio
              }`}
              style={{ 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              }}
            >
              {aspectRatio === 'portrait' ? (
                // Portrait Layout - Vertical Stack with Better Space Usage
                <>
                  {/* Show Image - Increased size by ~10% */}
                  <div className="relative h-52 bg-gray-50">
                    {show.imageUrl ? (
                      <img
                        src={show.imageUrl}
                        alt={show.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-medium">{show.name}</span>
                      </div>
                    )}
                    
                    {/* TV Tantrum Brand - Centered at bottom of image */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <span className="text-xs font-bold text-gray-800">tvtantrum.com</span>
                    </div>
                  </div>

                  {/* Content - Compact */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Show Title and Age Range */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight text-lg flex-1 pr-2">
                        {show.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 shrink-0">
                        <Users className="w-4 h-4" />
                        <span>Ages {show.ageRange}</span>
                      </div>
                    </div>

                    {/* Stimulation Score - Condensed */}
                    {show.stimulationScore && (
                      <div className="bg-gray-50 rounded-lg p-2.5 mb-2 flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge className={`text-xs ${getStimulationBadgeColor(show.stimulationScore)}`}>
                            {getStimulationLabel(show.stimulationScore)}
                          </Badge>
                          <p className="text-xs text-gray-500 font-medium">
                            More at <span className="font-bold text-blue-600">tvtantrum.com</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1.5">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-sm">Stimulation Level</span>
                        </div>
                        
                        <div className="flex gap-1 mb-1.5">
                          {renderStimulationDots(show.stimulationScore)}
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {getStimulationDescription(show.stimulationScore)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Square Layout - Side by Side
                <div className="flex h-full">
                  {/* Left Side - Image Column (50% width) */}
                  <div className="w-1/2 flex flex-col">
                    {/* TV Tantrum Brand - Centered at top of image */}
                    <div className="text-center py-2 bg-gray-50">
                      <span className="text-xs font-bold text-gray-800">tvtantrum.com</span>
                    </div>
                    
                    {/* Image */}
                    <div className="relative flex-1 bg-gray-50">
                      {show.imageUrl ? (
                        <img
                          src={show.imageUrl}
                          alt={show.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-medium text-center px-2">{show.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer - Underneath image */}
                    <div className="text-center py-2 bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium">
                        More at <span className="font-bold text-blue-600">tvtantrum.com</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Content (50% width) */}
                  <div className="w-1/2 p-3 flex flex-col">
                    {/* Show Title and Age Range */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 leading-tight text-sm flex-1 pr-2">
                        {show.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">Ages {show.ageRange}</span>
                      </div>
                    </div>

                    {/* Stimulation Score - Very Compact */}
                    {show.stimulationScore && (
                      <div className="bg-gray-50 rounded-lg p-2 mb-3 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge className={`text-xs ${getStimulationBadgeColor(show.stimulationScore)}`}>
                            {getStimulationLabel(show.stimulationScore)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <Zap className="w-3 h-3 text-yellow-600" />
                          <span className="font-semibold text-xs">Stimulation Level</span>
                        </div>
                        
                        <div className="flex gap-0.5 mb-2">
                          {renderStimulationDots(show.stimulationScore)}
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {getStimulationDescription(show.stimulationScore)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={async () => {
                const currentUrl = window.location.href;
                try {
                  await navigator.clipboard.writeText(currentUrl);
                  // Simple success indication - could add toast if needed
                } catch (error) {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = currentUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                }
              }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            <strong>Tip:</strong> Screenshot this image and crop it in your photo app for easy sharing on Instagram, Facebook, Twitter, or any social platform!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;