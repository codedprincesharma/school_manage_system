import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { timetablesApi, teachersApi, classesApi, Teacher, ClassItem, TimetablePeriod } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertTriangle, Save, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_PERIODS = [
  { startTime: "08:00", endTime: "08:45" },
  { startTime: "08:45", endTime: "09:30" },
  { startTime: "09:45", endTime: "10:30" },
  { startTime: "10:30", endTime: "11:15" },
  { startTime: "11:30", endTime: "12:15" },
  { startTime: "12:15", endTime: "13:00" },
  { startTime: "14:00", endTime: "14:45" },
  { startTime: "14:45", endTime: "15:30" },
];

interface TimetableSlot {
  subject: string;
  teacher_id: string;
}

type TimetableGrid = Record<string, Record<number, TimetableSlot>>;

export default function Timetables() {
  const { activeSchool } = useSchool();
  const { session } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [timetableGrid, setTimetableGrid] = useState<TimetableGrid>({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeSchool) {
      fetchInitialData();
    }
  }, [activeSchool, session]);

  useEffect(() => {
    if (selectedClass && activeSchool) {
      fetchTimetable();
    }
  }, [selectedClass, activeSchool, session]);

  const fetchInitialData = async () => {
    if (!activeSchool) return;

    try {
      const [classesData, teachersData] = await Promise.all([
        classesApi.getBySchool(activeSchool.id, session?.access_token),
        teachersApi.getBySchool(activeSchool.id, session?.access_token),
      ]);
      setClasses(classesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const fetchTimetable = async () => {
    if (!activeSchool || !selectedClass) return;

    setIsLoading(true);
    try {
      const data = await timetablesApi.getByClass(selectedClass, activeSchool.id, session?.access_token);

      // Convert API data to grid format
      const grid: TimetableGrid = {};
      DAYS.forEach((day) => {
        grid[day] = {};
        DEFAULT_PERIODS.forEach((_, periodIndex) => {
          grid[day][periodIndex] = { subject: "", teacher_id: "" };
        });
      });

      data.forEach((timetable) => {
        if (timetable.periods) {
          timetable.periods.forEach((period, index) => {
            if (grid[timetable.day]) {
              grid[timetable.day][index] = {
                subject: period.subject || "",
                teacher_id: period.teacher_id || "",
              };
            }
          });
        }
      });

      setTimetableGrid(grid);
    } catch (error) {
      console.error("Failed to fetch timetable:", error);
      // Initialize empty grid
      const grid: TimetableGrid = {};
      DAYS.forEach((day) => {
        grid[day] = {};
        DEFAULT_PERIODS.forEach((_, periodIndex) => {
          grid[day][periodIndex] = { subject: "", teacher_id: "" };
        });
      });
      setTimetableGrid(grid);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSlot = (day: string, periodIndex: number, field: "subject" | "teacher_id", value: string) => {
    setTimetableGrid((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [periodIndex]: {
          ...prev[day][periodIndex],
          [field]: value,
        },
      },
    }));

    // Check for conflicts when teacher is selected
    if (field === "teacher_id" && value) {
      checkConflicts(day, periodIndex, value);
    }
  };

  const checkConflicts = (day: string, periodIndex: number, teacherId: string) => {
    const conflictMessages: string[] = [];

    // Check if same teacher is assigned to another class at the same time
    Object.entries(timetableGrid).forEach(([otherDay, periods]) => {
      if (otherDay === day) {
        Object.entries(periods).forEach(([idx, slot]) => {
          if (Number(idx) === periodIndex && slot.teacher_id === teacherId) {
            const teacher = teachers.find((t) => t.id === teacherId);
            if (teacher) {
              conflictMessages.push(
                `${teacher.name} is already assigned at ${DEFAULT_PERIODS[periodIndex].startTime} on ${day}`
              );
            }
          }
        });
      }
    });

    if (conflictMessages.length > 0) {
      setConflicts((prev) => [...new Set([...prev, ...conflictMessages])]);
    }
  };

  const handleSave = async () => {
    if (!activeSchool || !selectedClass) return;

    setIsSaving(true);

    try {
      // Convert grid to API format and save each day
      for (const day of DAYS) {
        const periods: TimetablePeriod[] = DEFAULT_PERIODS.map((period, index) => ({
          startTime: period.startTime,
          endTime: period.endTime,
          subject: timetableGrid[day]?.[index]?.subject || "",
          teacher_id: timetableGrid[day]?.[index]?.teacher_id || undefined,
        }));

        await timetablesApi.create(
          { class: selectedClass, day, periods },
          activeSchool.id,
          session?.access_token
        );
      }

      toast({ title: "Success", description: "Timetable saved successfully" });
      setConflicts([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save timetable",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const availableSubjects = selectedClassData?.subjects || [];

  if (!activeSchool) {
    return (
      <MainLayout title="Timetables" subtitle="Manage class schedules">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a school to manage timetables</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Timetables" subtitle={`Manage schedules at ${activeSchool.name}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Class Selector */}
        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label>Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        Class {cls.className} {cls.section && `- ${cls.section}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedClass && (
                <Button
                  onClick={handleSave}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Timetable
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="border-warning/50 bg-warning/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Teacher Conflicts Detected</p>
                  <ul className="mt-2 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {conflict}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timetable Grid */}
        {selectedClass ? (
          isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Loading timetable...</span>
              </div>
            </div>
          ) : (
            <Card className="card-gradient border-border/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Weekly Schedule - Class {selectedClassData?.className}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="p-3 text-left bg-secondary/30 font-semibold w-32">Day / Period</th>
                        {DEFAULT_PERIODS.map((period, index) => (
                          <th key={index} className="p-3 text-center bg-secondary/30 font-semibold min-w-[120px]">
                            <div className="text-xs text-muted-foreground">Period {index + 1}</div>
                            <div className="text-xs">{period.startTime} - {period.endTime}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day) => (
                        <tr key={day} className="border-b border-border/50">
                          <td className="p-3 font-medium bg-secondary/20">{day}</td>
                          {DEFAULT_PERIODS.map((_, periodIndex) => (
                            <td key={periodIndex} className="p-2">
                              <div className="space-y-1">
                                <Select
                                  value={timetableGrid[day]?.[periodIndex]?.subject || ""}
                                  onValueChange={(value) => updateSlot(day, periodIndex, "subject", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-secondary/30">
                                    <SelectValue placeholder="Subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {availableSubjects.map((subject) => (
                                      <SelectItem key={subject} value={subject}>
                                        {subject}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="Break">Break</SelectItem>
                                    <SelectItem value="Assembly">Assembly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={timetableGrid[day]?.[periodIndex]?.teacher_id || ""}
                                  onValueChange={(value) => updateSlot(day, periodIndex, "teacher_id", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-secondary/30">
                                    <SelectValue placeholder="Teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {teachers.map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a class to view/edit its timetable</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
