
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  alt?: string;
}

const Lightbox = ({ isOpen, onClose, imageSrc, alt = "Image" }: LightboxProps) => {
  const [scale, setScale] = useState(1);
  
  // Reset zoom when opening new images
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen, imageSrc]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-poster-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <div 
            className="relative max-w-full max-h-[90vh] overflow-auto bg-black rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 z-50 flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-70 hover:opacity-100 backdrop-blur-sm bg-black/30 text-white" 
                onClick={handleZoomOut}
              >
                <ZoomOut size={18} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-70 hover:opacity-100 backdrop-blur-sm bg-black/30 text-white" 
                onClick={handleZoomIn}
              >
                <ZoomIn size={18} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-70 hover:opacity-100 backdrop-blur-sm bg-black/30 text-white" 
                onClick={handleDownload}
              >
                <Download size={18} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-70 hover:opacity-100 backdrop-blur-sm bg-black/30 text-white" 
                onClick={onClose}
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="flex items-center justify-center min-h-[200px]">
              <img 
                src={imageSrc} 
                alt={alt} 
                className={cn(
                  "max-w-full max-h-[90vh] object-contain transition-transform duration-200",
                )}
                style={{ transform: `scale(${scale})` }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Lightbox;
