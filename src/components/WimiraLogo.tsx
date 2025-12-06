import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface WimiraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  clickable?: boolean;
}

export const WimiraLogo = ({ size = "md", showText = true, className, clickable = true }: WimiraLogoProps) => {
  const navigate = useNavigate();
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl md:text-5xl",
  };

  const handleClick = () => {
    if (clickable) {
      navigate("/");
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3", 
        clickable && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={handleClick}
    >
      {/* Logo Mark - Sequential Flow Symbol */}
      <div className={cn("relative flex items-center justify-center rounded-2xl bg-primary/20 glow-primary", sizeClasses[size])}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          className="w-2/3 h-2/3"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Three flowing lines representing sequential queue flow */}
          <path
            d="M8 12C12 12 14 16 18 16C22 16 24 12 28 12C32 12 34 16 36 16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
          />
          <path
            d="M4 20C8 20 10 24 14 24C18 24 20 20 24 20C28 20 30 24 32 24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary opacity-70"
          />
          <path
            d="M8 28C12 28 14 32 18 32C22 32 24 28 28 28C32 28 34 32 36 32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary opacity-40"
          />
        </svg>
      </div>

      {showText && (
        <div>
          <h1 className={cn("font-bold text-foreground", textSizes[size])}>
            Wi<span className="text-primary">mira</span>
          </h1>
          {size === "xl" && (
            <p className="text-sm text-muted-foreground">Token Management System</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WimiraLogo;
