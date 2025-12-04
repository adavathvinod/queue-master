import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OdometerDisplayProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const OdometerDisplay = ({ value, label, size = "lg" }: OdometerDisplayProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const digits = String(displayValue).split("");
  
  const sizeClasses = {
    sm: "text-3xl h-12 w-8",
    md: "text-5xl h-16 w-12",
    lg: "text-7xl h-24 w-16",
    xl: "text-9xl h-32 w-24",
  };

  const containerSizes = {
    sm: "gap-1 p-3",
    md: "gap-2 p-4",
    lg: "gap-2 p-6",
    xl: "gap-3 p-8",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn(
        "flex items-center justify-center card-gradient rounded-2xl border border-border/50 shadow-2xl",
        containerSizes[size]
      )}>
        {digits.map((digit, index) => (
          <div
            key={`${index}-${digit}`}
            className={cn(
              "relative overflow-hidden bg-background/50 rounded-lg border border-border/30 flex items-center justify-center font-mono font-bold",
              sizeClasses[size]
            )}
          >
            <span
              className={cn(
                "text-primary transition-all duration-300",
                isAnimating && "animate-roll-up"
              )}
            >
              {digit}
            </span>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OdometerDisplay;
