import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Utensils, 
  ShoppingBag, 
  Landmark, 
  Briefcase, 
  GraduationCap,
  Stethoscope,
  MoreHorizontal
} from "lucide-react";

export const INDUSTRY_TYPES = [
  { value: "hospital", label: "Hospital / Healthcare", icon: Stethoscope },
  { value: "restaurant", label: "Restaurant / Food Service", icon: Utensils },
  { value: "retail", label: "Retail Shop", icon: ShoppingBag },
  { value: "government", label: "Government Office", icon: Landmark },
  { value: "corporate", label: "Corporate / IT Company", icon: Briefcase },
  { value: "education", label: "Education Institution", icon: GraduationCap },
  { value: "bank", label: "Bank / Financial Services", icon: Building2 },
  { value: "other", label: "Other", icon: MoreHorizontal },
] as const;

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const IndustrySelect = ({ value, onChange }: IndustrySelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="industry">Industry Type *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="industry">
          <SelectValue placeholder="Select your industry" />
        </SelectTrigger>
        <SelectContent>
          {INDUSTRY_TYPES.map((industry) => (
            <SelectItem key={industry.value} value={industry.value}>
              <div className="flex items-center gap-2">
                <industry.icon className="w-4 h-4" />
                {industry.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const getIndustryLabel = (value: string) => {
  return INDUSTRY_TYPES.find((i) => i.value === value)?.label || value;
};

export default IndustrySelect;
