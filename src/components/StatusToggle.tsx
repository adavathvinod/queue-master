import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface StatusToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: "default" | "success" | "warning";
}

const StatusToggle = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  variant = "default",
}: StatusToggleProps) => {
  const variantStyles = {
    default: checked ? "border-primary/50 bg-primary/10" : "border-border",
    success: checked ? "border-success/50 bg-success/10" : "border-border",
    warning: checked ? "border-accent/50 bg-accent/10" : "border-border",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
        variantStyles[variant],
        disabled && "opacity-50"
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-foreground">{label}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "data-[state=checked]:bg-primary",
          variant === "success" && "data-[state=checked]:bg-success",
          variant === "warning" && "data-[state=checked]:bg-accent"
        )}
      />
    </div>
  );
};

export default StatusToggle;
