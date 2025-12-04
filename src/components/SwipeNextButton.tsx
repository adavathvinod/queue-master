import { useState, useRef } from "react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeNextButtonProps {
  onSwipe: () => void;
  disabled?: boolean;
  label?: string;
}

const SwipeNextButton = ({ onSwipe, disabled = false, label = "Swipe to serve next" }: SwipeNextButtonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const threshold = 200;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isComplete) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isComplete) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = Math.max(0, Math.min(currentX - startXRef.current, threshold));
    setDragX(diff);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = Math.max(0, Math.min(e.clientX - startXRef.current, threshold));
    setDragX(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    if (dragX >= threshold * 0.9) {
      setIsComplete(true);
      setDragX(threshold);
      onSwipe();
      
      setTimeout(() => {
        setIsComplete(false);
        setDragX(0);
      }, 500);
    } else {
      setDragX(0);
    }
    
    setIsDragging(false);
  };

  const progress = dragX / threshold;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-16 rounded-full overflow-hidden select-none",
        "bg-secondary border-2 border-border",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-grab active:cursor-grabbing"
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      {/* Background progress */}
      <div
        className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-100"
        style={{ width: `${progress * 100}%` }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "text-sm font-medium text-muted-foreground transition-opacity",
            progress > 0.3 && "opacity-0"
          )}
        >
          {label}
        </span>
      </div>

      {/* Draggable thumb */}
      <div
        className={cn(
          "absolute top-1 bottom-1 left-1 w-14 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-transform duration-100",
          isComplete && "bg-success"
        )}
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
      >
        {isComplete ? (
          <Check className="w-6 h-6" />
        ) : (
          <div className="flex items-center animate-swipe-hint">
            <ChevronRight className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeNextButton;
