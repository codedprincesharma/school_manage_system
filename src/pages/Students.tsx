import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { studentsApi, Student } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, GraduationCap, User, Phone, Hash, Loader2 } from "lucide-react";

const CLASS_OPTIONS = ["PG", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function Students() {
  const { activeSchool } = useSchool();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    classNo: "",
    schoolRollNo: "",
    classRollNo: "",
    parentName: "",
    contactNo: "",
  });

  useEffect(() => {
    if (activeSchool) {
      fetchStudents();
    } else {
      setStudents([]);
      setIsLoading(false);
    }
  }, [activeSchool, token]);

  const fetchStudents = async () => {
    if (!activeSchool) return;
    
    setIsLoading(true);
    try {
      const data = await studentsApi.getBySchool(activeSchool.id, token);
      setStudents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      classNo: "",
      schoolRollNo: "",
      classRollNo: "",
      parentName: "",
      contactNo: "",
    });
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool) return;

    setIsSubmitting(true);

    try {
      if (editingStudent) {
        const updated = await studentsApi.update(
          editingStudent.id,
          formData,
          activeSchool.id,
          token
        );
        setStudents(students.map((s) => (s.id === updated.id ? updated : s)));
        toast({ title: "Success", description: "Student updated successfully" });
      } else {
        const newStudent = await studentsApi.create(formData, activeSchool.id, token);
        setStudents([...students, newStudent]);
        toast({ title: "Success", description: "Student added successfully" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      classNo: student.classNo,
      schoolRollNo: student.schoolRollNo,
      classRollNo: student.classRollNo,
      parentName: student.parentName,
      contactNo: student.contactNo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await studentsApi.delete(deleteId, token);
      setStudents(students.filter((s) => s.id !== deleteId));
      toast({ title: "Success", description: "Student deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      header: "Student",
      cell: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{student.name}</p>
            <p className="text-sm text-muted-foreground">Class {student.classNo}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Roll Numbers",
      cell: (student: Student) => (
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">School:</span> {student.schoolRollNo}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Class:</span> {student.classRollNo}
          </p>
        </div>
      ),
    },
    {
      header: "Parent",
      accessorKey: "parentName" as keyof Student,
    },
    {
      header: "Contact",
      accessorKey: "contactNo" as keyof Student,
    },
    {
      header: "Actions",
      cell: (student: Student) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(student);
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
              setDeleteId(student.id);
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
      <MainLayout title="Students" subtitle="Manage student records">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please select a school to manage students</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Students" subtitle={`Manage students at ${activeSchool.name}`}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} enrolled
          </p>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md card-gradient border-border/50">
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Update student information" : "Enter the student details"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Student name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-9 bg-secondary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classNo">Class</Label>
                    <Select
                      value={formData.classNo}
                      onValueChange={(value) => setFormData({ ...formData, classNo: value })}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolRollNo">School Roll No</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="schoolRollNo"
                        placeholder="e.g., 2024001"
                        value={formData.schoolRollNo}
                        onChange={(e) => setFormData({ ...formData, schoolRollNo: e.target.value })}
                        className="pl-9 bg-secondary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classRollNo">Class Roll No</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="classRollNo"
                        placeholder="e.g., 1"
                        value={formData.classRollNo}
                        onChange={(e) => setFormData({ ...formData, classRollNo: e.target.value })}
                        className="pl-9 bg-secondary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      placeholder="Parent/guardian name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="bg-secondary/50"
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="contactNo">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactNo"
                        placeholder="+1 234 567 890"
                        value={formData.contactNo}
                        onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                        className="pl-9 bg-secondary/50"
                        required
                      />
                    </div>
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
                    ) : editingStudent ? (
                      "Update Student"
                    ) : (
                      "Add Student"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          emptyMessage="No students enrolled yet. Add your first student to get started."
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="card-gradient border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this student? This action cannot be undone.
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
