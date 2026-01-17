import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { teachersApi, Teacher } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Users, Mail, Phone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CLASS_OPTIONS = ["PG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SUBJECT_OPTIONS = ["English", "Hindi", "Maths", "GK", "SST", "Science", "Computer", "Art", "Music", "PE"];

export default function Teachers() {
  const { activeSchool } = useSchool();
  const { session } = useAuth();
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    classes: [] as string[],
    subjects: [] as string[],
  });

  useEffect(() => {
    if (activeSchool) {
      fetchTeachers();
    } else {
      setTeachers([]);
      setIsLoading(false);
    }
  }, [activeSchool, session]);

  const fetchTeachers = async () => {
    if (!activeSchool) return;

    setIsLoading(true);
    try {
      const data = await teachersApi.getBySchool(activeSchool.id, session?.access_token);
      setTeachers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teachers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      classes: [],
      subjects: [],
    });
    setEditingTeacher(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool) return;

    setIsSubmitting(true);

    try {
      if (editingTeacher) {
        const updated = await teachersApi.update(
          editingTeacher.id,
          formData,
          activeSchool.id,
          session?.access_token
        );
        setTeachers(teachers.map((t) => (t.id === updated.id ? updated : t)));
        toast({ title: "Success", description: "Teacher updated successfully" });
      } else {
        const newTeacher = await teachersApi.create(formData, activeSchool.id, session?.access_token);
        setTeachers([...teachers, newTeacher]);
        toast({ title: "Success", description: "Teacher added successfully" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save teacher",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      classes: teacher.classes || [],
      subjects: teacher.subjects || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await teachersApi.delete(deleteId, session?.access_token);
      setTeachers(teachers.filter((t) => t.id !== deleteId));
      toast({ title: "Success", description: "Teacher deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const toggleClass = (cls: string) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter((c) => c !== cls)
        : [...prev.classes, cls],
    }));
  };

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const columns = [
    {
      header: "Teacher",
      cell: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{teacher.name}</p>
            <p className="text-sm text-muted-foreground">{teacher.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (teacher: Teacher) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{teacher.phone || "—"}</span>
        </div>
      ),
    },
    {
      header: "Classes",
      cell: (teacher: Teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.classes?.length > 0 ? (
            teacher.classes.slice(0, 4).map((cls) => (
              <Badge key={cls} variant="secondary" className="text-xs">
                {cls}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
          {teacher.classes?.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{teacher.classes.length - 4}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Subjects",
      cell: (teacher: Teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.subjects?.length > 0 ? (
            teacher.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject} className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                {subject}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
          {teacher.subjects?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{teacher.subjects.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      cell: (teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(teacher);
            }}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(teacher.id);
            }}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  if (!activeSchool) {
    return (
      <MainLayout title="Teachers" subtitle="Manage teaching staff">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a school to manage teachers</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Teachers" subtitle={`Manage teachers at ${activeSchool.name}`}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} registered
          </p>

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
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg card-gradient border-border/50 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                <DialogDescription>
                  {editingTeacher ? "Update teacher information" : "Enter the teacher details"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Teacher name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="teacher@school.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-9 bg-secondary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+1 234 567 890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-9 bg-secondary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Classes (JSONB)</Label>
                  <div className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-lg">
                    {CLASS_OPTIONS.map((cls) => (
                      <label
                        key={cls}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.classes.includes(cls)}
                          onCheckedChange={() => toggleClass(cls)}
                        />
                        <span className="text-sm">{cls}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Subjects (JSONB)</Label>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/30 rounded-lg">
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
                    ) : editingTeacher ? (
                      "Update Teacher"
                    ) : (
                      "Add Teacher"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={teachers}
          isLoading={isLoading}
          emptyMessage="No teachers registered yet. Add your first teacher to get started."
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="card-gradient border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this teacher? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
