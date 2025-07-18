import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface VideoPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  productName: string;
}

// Helper function to extract video ID and provider from various video URLs
const getVideoEmbedInfo = (url: string) => {
  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      provider: 'youtube',
      id: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`
    };
  }

  // Vimeo patterns
  const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      provider: 'vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // Amazon Video patterns
  const amazonRegex = /amazon\.com\/vdp\/([a-zA-Z0-9]+)/;
  const amazonMatch = url.match(amazonRegex);
  if (amazonMatch) {
    return {
      provider: 'amazon',
      id: amazonMatch[1],
      embedUrl: null // Amazon videos can't be embedded
    };
  }

  // Direct video file patterns
  const directVideoRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  if (directVideoRegex.test(url)) {
    return {
      provider: 'direct',
      id: null,
      embedUrl: url
    };
  }

  return null;
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  isOpen, 
  onClose, 
  videoUrl, 
  productName 
}) => {
  const videoInfo = getVideoEmbedInfo(videoUrl);

  const renderVideoContent = () => {
    if (!videoInfo) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Video preview not available</p>
            <p className="text-sm text-gray-500">This video format is not supported for embedding</p>
            <button 
              onClick={() => window.open(videoUrl, '_blank')}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Open Video in New Tab
            </button>
          </div>
        </div>
      );
    }

    if (videoInfo.provider === 'amazon') {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Amazon Video Preview</p>
            <p className="text-sm text-gray-500 mb-4">
              Amazon videos cannot be embedded directly. Click below to view the video.
            </p>
            <button 
              onClick={() => window.open(videoUrl, '_blank')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              View on Amazon
            </button>
          </div>
        </div>
      );
    }

    if (videoInfo.provider === 'direct') {
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            controls
            autoPlay
            preload="metadata"
          >
            <source src={videoInfo.embedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // YouTube and Vimeo embeds
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={videoInfo.embedUrl}
          title={`${productName} - Video Preview`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold pr-8">
            {productName} - Video Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderVideoContent()}
        </div>
        
        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>This video preview keeps you on our site. Use the affiliate link to purchase the product.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};