import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { lessonPlansApi, LessonPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileText, Video, BookOpen, Save, Loader2 } from "lucide-react";

const CLASS_OPTIONS = ["PG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SUBJECT_OPTIONS = ["English", "Hindi", "Maths", "GK", "SST", "Science", "Computer"];

export default function LessonPlans() {
  const { activeSchool } = useSchool();
  const { session } = useAuth();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);

  const [weekData, setWeekData] = useState<Record<number, {
    videoUrl: string;
    lessonText: string;
    homeworkText: string;
  }>>({});

  useEffect(() => {
    if (activeSchool && selectedClass && selectedSubject) {
      fetchLessonPlans();
    }
  }, [activeSchool, selectedClass, selectedSubject, session]);

  const fetchLessonPlans = async () => {
    if (!activeSchool || !selectedClass || !selectedSubject) return;

    setIsLoading(true);
    try {
      const data = await lessonPlansApi.getByClass(
        selectedClass,
        selectedSubject,
        activeSchool.id,
        session?.access_token
      );
      setLessonPlans(data);

      // Initialize week data from fetched plans
      const newWeekData: typeof weekData = {};
      data.forEach((plan) => {
        newWeekData[plan.weekNo] = {
          videoUrl: plan.videoUrl || "",
          lessonText: plan.lessonText || "",
          homeworkText: plan.homeworkText || "",
        };
      });
      setWeekData(newWeekData);
    } catch (error) {
      console.error("Failed to fetch lesson plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWeek = async (weekNo: number) => {
    if (!activeSchool || !selectedClass || !selectedSubject) return;

    const data = weekData[weekNo];
    if (!data) return;

    setSavingWeek(weekNo);

    try {
      const existingPlan = lessonPlans.find((p) => p.weekNo === weekNo);
      const planData = {
        classNo: selectedClass,
        subject: selectedSubject,
        weekNo,
        ...data,
      };

      if (existingPlan) {
        await lessonPlansApi.update(existingPlan.id, planData, activeSchool.id, session?.access_token);
      } else {
        const newPlan = await lessonPlansApi.create(planData, activeSchool.id, session?.access_token);
        setLessonPlans([...lessonPlans, newPlan]);
      }

      toast({ title: "Success", description: `Week ${weekNo} saved successfully` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson plan",
        variant: "destructive",
      });
    } finally {
      setSavingWeek(null);
    }
  };

  const updateWeekData = (weekNo: number, field: string, value: string) => {
    setWeekData((prev) => ({
      ...prev,
      [weekNo]: {
        ...(prev[weekNo] || { videoUrl: "", lessonText: "", homeworkText: "" }),
        [field]: value,
      },
    }));
  };

  const weeks = Array.from({ length: 30 }, (_, i) => i + 1);

  if (!activeSchool) {
    return (
      <MainLayout title="Lesson Plans" subtitle="Manage weekly lesson plans">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a school to manage lesson plans</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Lesson Plans" subtitle={`Manage lesson plans at ${activeSchool.name}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        Class {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week Editor */}
        {selectedClass && selectedSubject ? (
          isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Loading lesson plans...</span>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="1" className="space-y-4">
              <div className="overflow-x-auto pb-2">
                <TabsList className="bg-secondary/30 h-auto flex-wrap">
                  {weeks.map((week) => (
                    <TabsTrigger
                      key={week}
                      value={week.toString()}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Week {week}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {weeks.map((week) => (
                <TabsContent key={week} value={week.toString()}>
                  <Card className="card-gradient border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Week {week} - {selectedSubject} (Class {selectedClass})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          YouTube Video URL (Private)
                        </Label>
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={weekData[week]?.videoUrl || ""}
                          onChange={(e) => updateWeekData(week, "videoUrl", e.target.value)}
                          className="bg-secondary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Lesson Content</Label>
                        <Textarea
                          placeholder="Enter the lesson content for this week..."
                          value={weekData[week]?.lessonText || ""}
                          onChange={(e) => updateWeekData(week, "lessonText", e.target.value)}
                          className="bg-secondary/50 min-h-[120px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Homework Instructions</Label>
                        <Textarea
                          placeholder="Enter homework assignments for this week..."
                          value={weekData[week]?.homeworkText || ""}
                          onChange={(e) => updateWeekData(week, "homeworkText", e.target.value)}
                          className="bg-secondary/50 min-h-[100px]"
                        />
                      </div>

                      <Button
                        onClick={() => handleSaveWeek(week)}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        disabled={savingWeek === week}
                      >
                        {savingWeek === week ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Week {week}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a class and subject to view/edit lesson plans</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
