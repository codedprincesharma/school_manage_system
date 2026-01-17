const API_BASE = import.meta.env.VITE_API_BASE || "https://dreams-1-ia11.onrender.com/api/v1";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  schoolId?: string;
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, schoolId, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    const payload = schoolId ? { ...body, school_id: schoolId } : body;
    config.body = JSON.stringify(payload);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Schools API
export const schoolsApi = {
  getAll: (token?: string) => apiRequest<School[]>("/schools", { token }),
  create: (data: Omit<School, "id">, token?: string) =>
    apiRequest<School>("/schools", { method: "POST", body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/schools/${id}`, { method: "DELETE", token }),
};

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiRequest<{ access_token: string; refresh_token: string; user: any }>("/login", { method: "POST", body: data }),
  register: (data: { email: string; password: string; role: string }) =>
    apiRequest<{ access_token: string; refresh_token: string; user: any }>("/register", { method: "POST", body: data }),
  refreshToken: (refreshToken: string) =>
    apiRequest<{ access_token: string }>("/refresh-token", { method: "GET" }),
  logout: (token?: string) =>
    apiRequest<void>("/logout", { method: "POST", token }),
  getProfile: (token?: string) =>
    apiRequest<any>("/me", { token }),
};

// Students API
export const studentsApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<Student[]>(`/students/school/${schoolId}`, { token }),
  create: (data: Omit<Student, "id">, schoolId: string, token?: string) =>
    apiRequest<Student>("/students", { method: "POST", body: data, schoolId, token }),
  update: (id: string, data: Partial<Student>, schoolId: string, token?: string) =>
    apiRequest<Student>(`/students/${id}`, { method: "PUT", body: data, schoolId, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/students/${id}`, { method: "DELETE", token }),
};

// Teachers API
export const teachersApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<Teacher[]>(`/teachers/school/${schoolId}`, { token }),
  create: (data: Omit<Teacher, "id">, schoolId: string, token?: string) =>
    apiRequest<Teacher>("/teachers", { method: "POST", body: data, schoolId, token }),
  update: (id: string, data: Partial<Teacher>, schoolId: string, token?: string) =>
    apiRequest<Teacher>(`/teachers/${id}`, { method: "PUT", body: data, schoolId, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/teachers/${id}`, { method: "DELETE", token }),
};

// Classes API
export const classesApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<ClassItem[]>(`/classes/school/${schoolId}`, { token }),
  create: (data: Omit<ClassItem, "id">, schoolId: string, token?: string) =>
    apiRequest<ClassItem>("/classes", { method: "POST", body: data, schoolId, token }),
  updateSubjects: (id: string, subjects: string[], token?: string) =>
    apiRequest<ClassItem>(`/classes/${id}/subjects`, { method: "PUT", body: { subjects }, token }),
};

// Lesson Plans API
export const lessonPlansApi = {
  getByClass: (classNo: string, subject: string, schoolId: string, token?: string) =>
    apiRequest<LessonPlan[]>(`/lesson-plans?classNo=${classNo}&subject=${subject}&school_id=${schoolId}`, { token }),
  create: (data: Omit<LessonPlan, "id">, schoolId: string, token?: string) =>
    apiRequest<LessonPlan>("/lesson-plans", { method: "POST", body: data, schoolId, token }),
  update: (id: string, data: Partial<LessonPlan>, schoolId: string, token?: string) =>
    apiRequest<LessonPlan>(`/lesson-plans/${id}`, { method: "PUT", body: data, schoolId, token }),
};

// Timetables API
export const timetablesApi = {
  getByClass: (classId: string, schoolId: string, token?: string) =>
    apiRequest<Timetable[]>(`/timetables/class/${classId}?school_id=${schoolId}`, { token }),
  create: (data: Omit<Timetable, "id">, schoolId: string, token?: string) =>
    apiRequest<Timetable>("/timetables/class", { method: "POST", body: data, schoolId, token }),
  generateTeachers: (schoolId: string, token?: string) =>
    apiRequest<any>("/timetables/generate-teachers", { method: "POST", body: { school_id: schoolId }, token }),
};

// Types
export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  classNo: string;
  schoolRollNo: string;
  classRollNo: string;
  parentName: string;
  contactNo: string;
  school_id?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  classes: string[];
  subjects: string[];
  school_id?: string;
}

export interface ClassItem {
  id: string;
  className: string;
  section: string;
  subjects: string[];
  school_id?: string;
}

export interface LessonPlan {
  id: string;
  classNo: string;
  subject: string;
  weekNo: number;
  videoUrl: string;
  lessonText: string;
  homeworkText: string;
  school_id?: string;
}

export interface TimetablePeriod {
  startTime: string;
  endTime: string;
  subject: string;
  teacher_id?: string;
}

export interface Timetable {
  id: string;
  class: string;
  day: string;
  periods: TimetablePeriod[];
  school_id?: string;
}
