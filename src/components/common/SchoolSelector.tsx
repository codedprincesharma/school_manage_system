import { useSchool } from "@/contexts/SchoolContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School } from "lucide-react";

export function SchoolSelector() {
  const { activeSchool, setActiveSchool, schools } = useSchool();

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (school) {
      setActiveSchool(school);
    }
  };

  if (schools.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
        <School className="w-4 h-4" />
        <span>No schools available</span>
      </div>
    );
  }

  return (
    <Select
      value={activeSchool?.id || ""}
      onValueChange={handleSchoolChange}
    >
      <SelectTrigger className="w-[220px] bg-secondary/50 border-border/50">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Select a school" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {schools.map((school) => (
          <SelectItem key={school.id} value={school.id}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
