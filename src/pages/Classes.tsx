import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { classesApi, ClassItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Settings, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SUBJECT_OPTIONS = ["English", "Hindi", "Maths", "GK", "SST", "Science", "Computer", "Art", "Music", "PE"];

// Default subject mapping logic
const getDefaultSubjects = (className: string): string[] => {
  const cls = className.toUpperCase();
  if (["PG", "LKG", "UKG"].includes(cls)) {
    return ["English", "Hindi", "Maths"];
  }
  if (["1", "2"].includes(cls)) {
    return ["English", "Hindi", "Maths", "GK"];
  }
  if (["3", "4", "5", "6"].includes(cls)) {
    return ["English", "Hindi", "Maths", "GK", "SST"];
  }
  return ["English", "Hindi", "Maths", "GK", "SST", "Science"];
};

export default function Classes() {
  const { activeSchool } = useSchool();
  const { token } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    className: "",
    section: "",
    subjects: [] as string[],
  });

  useEffect(() => {
    if (activeSchool) {
      fetchClasses();
    } else {
      setClasses([]);
      setIsLoading(false);
    }
  }, [activeSchool, token]);

  const fetchClasses = async () => {
    if (!activeSchool) return;

    setIsLoading(true);
    try {
      const data = await classesApi.getBySchool(activeSchool.id, token);
      setClasses(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: "",
      section: "",
      subjects: [],
    });
    setEditingClass(null);
  };

  const handleClassNameChange = (className: string) => {
    const defaultSubjects = getDefaultSubjects(className);
    setFormData({
      ...formData,
      className,
      subjects: defaultSubjects,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool) return;

    setIsSubmitting(true);

    try {
      if (editingClass) {
        await classesApi.updateSubjects(editingClass.id, formData.subjects, token);
        setClasses(
          classes.map((c) =>
            c.id === editingClass.id ? { ...c, subjects: formData.subjects } : c
          )
        );
        toast({ title: "Success", description: "Class subjects updated" });
      } else {
        const newClass = await classesApi.create(formData, activeSchool.id, token);
        setClasses([...classes, newClass]);
        toast({ title: "Success", description: "Class added successfully" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save class",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setFormData({
      className: classItem.className,
      section: classItem.section,
      subjects: classItem.subjects || [],
    });
    setIsDialogOpen(true);
  };

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  if (!activeSchool) {
    return (
      <MainLayout title="Classes & Subjects" subtitle="Configure class structure">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a school to manage classes</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Classes & Subjects" subtitle={`Configure classes at ${activeSchool.name}`}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {classes.length} class{classes.length !== 1 ? "es" : ""} configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Default mapping: PG-UKG (3 subjects) → 1-2 (+GK) → 3-6 (+SST)
            </p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md card-gradient border-border/50">
              <DialogHeader>
                <DialogTitle>{editingClass ? "Edit Class Subjects" : "Add New Class"}</DialogTitle>
                <DialogDescription>
                  {editingClass
                    ? "Update the subjects for this class"
                    : "Configure class name, section, and subjects"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {!editingClass && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name</Label>
                      <Input
                        id="className"
                        placeholder="e.g., 5, PG, LKG"
                        value={formData.className}
                        onChange={(e) => handleClassNameChange(e.target.value)}
                        className="bg-secondary/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        placeholder="e.g., A, B"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Subjects</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                    {SUBJECT_OPTIONS.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.subjects.includes(subject)}
                          onCheckedChange={() => toggleSubject(subject)}
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingClass ? (
                      "Update Subjects"
                    ) : (
                      "Add Class"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No classes configured yet. Add your first class to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className="card-gradient border-border/50 hover:border-primary/30 transition-colors group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    Class {classItem.className}
                    {classItem.section && (
                      <span className="text-muted-foreground">- {classItem.section}</span>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(classItem)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {classItem.subjects?.length > 0 ? (
                      classItem.subjects.map((subject) => (
                        <Badge
                          key={subject}
                          variant="secondary"
                          className="text-xs"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No subjects assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
