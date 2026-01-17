import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/common/StatCard";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { schoolsApi, studentsApi, teachersApi, classesApi, School } from "@/lib/api";
import { School as SchoolIcon, Users, GraduationCap, BookOpen, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { schools, setSchools, activeSchool } = useSchool();
  const { token } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await schoolsApi.getAll(token);
        setSchools(data);
      } catch (error) {
        console.error("Failed to fetch schools:", error);
      }
    };

    fetchSchools();
  }, [token, setSchools]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!activeSchool) {
        setStats({ students: 0, teachers: 0, classes: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [students, teachers, classes] = await Promise.all([
          studentsApi.getBySchool(activeSchool.id, token).catch(() => []),
          teachersApi.getBySchool(activeSchool.id, token).catch(() => []),
          classesApi.getBySchool(activeSchool.id, token).catch(() => []),
        ]);

        setStats({
          students: students.length,
          teachers: teachers.length,
          classes: classes.length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeSchool, token]);

  return (
    <MainLayout title="Dashboard" subtitle="Overview of your school management system">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Schools"
            value={schools.length}
            icon={SchoolIcon}
            subtitle="Registered schools"
          />
          <StatCard
            title="Students"
            value={loading ? "..." : stats.students}
            icon={GraduationCap}
            subtitle={activeSchool ? `In ${activeSchool.name}` : "Select a school"}
          />
          <StatCard
            title="Teachers"
            value={loading ? "..." : stats.teachers}
            icon={Users}
            subtitle={activeSchool ? `In ${activeSchool.name}` : "Select a school"}
          />
          <StatCard
            title="Classes"
            value={loading ? "..." : stats.classes}
            icon={BookOpen}
            subtitle={activeSchool ? `In ${activeSchool.name}` : "Select a school"}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSchool ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <div>
                      <p className="text-sm font-medium">School Active</p>
                      <p className="text-xs text-muted-foreground">
                        Managing {activeSchool.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="w-2 h-2 bg-info rounded-full" />
                    <div>
                      <p className="text-sm font-medium">{stats.students} Students Enrolled</p>
                      <p className="text-xs text-muted-foreground">
                        Across {stats.classes} classes
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a school to view activity
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-primary" />
                Registered Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schools.length > 0 ? (
                <div className="space-y-3">
                  {schools.slice(0, 5).map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <SchoolIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{school.name}</p>
                          <p className="text-xs text-muted-foreground">{school.email}</p>
                        </div>
                      </div>
                      {activeSchool?.id === school.id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No schools registered yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
