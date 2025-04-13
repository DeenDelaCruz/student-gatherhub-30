
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize, Minimize } from "lucide-react";
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
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  
  // Reset zoom, rotation and position when opening new images
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setIsFullscreen(false);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };
  
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
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

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (!isFullscreen) {
        const element = document.querySelector('.lightbox-container') as HTMLElement;
        if (element && document.documentElement.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback if fullscreen API fails
      setIsFullscreen(!isFullscreen);
    }
  };
  
  // Image dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - position.x, 
        y: e.clientY - position.y
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Reset position on zoom out to 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Close lightbox on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent overflow-hidden",
          isFullscreen && "fixed inset-0 max-w-none max-h-none w-screen h-screen rounded-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center w-full h-full lightbox-container">
          <div 
            className={cn(
              "relative max-w-full max-h-[90vh] overflow-hidden bg-black rounded-lg shadow-2xl",
              isFullscreen && "max-h-screen w-screen h-screen rounded-none"
            )}
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
                onClick={handleRotate}
              >
                <RotateCw size={18} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-70 hover:opacity-100 backdrop-blur-sm bg-black/30 text-white" 
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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
            
            <div className={cn(
              "flex items-center justify-center min-h-[200px]",
              isFullscreen && "h-screen"
            )}>
              <div
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={imageSrc} 
                  alt={alt} 
                  className={cn(
                    "max-w-full max-h-[90vh] object-contain transition-transform duration-200",
                    isFullscreen && "max-h-screen"
                  )}
                  style={{ 
                    transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x/scale}px, ${position.y/scale}px)`,
                    transformOrigin: 'center center'
                  }}
                  draggable="false"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Lightbox;
