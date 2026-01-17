import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { School } from "@/lib/api";

interface SchoolContextType {
  activeSchool: School | null;
  setActiveSchool: (school: School | null) => void;
  schools: School[];
  setSchools: (schools: School[]) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [activeSchool, setActiveSchool] = useState<School | null>(() => {
    const saved = localStorage.getItem("activeSchool");
    return saved ? JSON.parse(saved) : null;
  });
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    if (activeSchool) {
      localStorage.setItem("activeSchool", JSON.stringify(activeSchool));
    } else {
      localStorage.removeItem("activeSchool");
    }
  }, [activeSchool]);

  return (
    <SchoolContext.Provider value={{ activeSchool, setActiveSchool, schools, setSchools }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}
