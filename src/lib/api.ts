const API_BASE = import.meta.env.VITE_API_BASE || "https://dreams-1-ia11.onrender.com/api/v1";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
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
    
    // Debug logging for auth endpoints
    if (endpoint.includes('/login') || endpoint.includes('/register')) {
      console.log(`API Request: ${method} ${API_BASE}${endpoint}`);
      console.log('Request payload:', payload);
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      // Handle different error response formats
      const errorMessage = errorData.detail || errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (error: any) {
    // Re-throw if it's already our formatted error
    if (error.message && error.status) {
      throw error;
    }
    // Handle network errors
    if (error.message === "Failed to fetch" || error.message.includes("NetworkError")) {
      throw new Error("Network error: Could not connect to the server. Please check your internet connection and ensure the API server is running.");
    }
    throw error;
  }
}

// Schools API
export const schoolsApi = {
  getAll: (token?: string) => apiRequest<School[]>("/schools", { token }),
  create: (data: Omit<School, "id">, token?: string) =>
    apiRequest<School>("/schools", { method: "POST", body: data, token }),
  update: (id: string, data: Partial<School>, token?: string) =>
    apiRequest<School>(`/schools/${id}`, { method: "PUT", body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/schools/${id}`, { method: "DELETE", token }),
};

// Auth API - Using /login endpoint (verified to exist)
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiRequest<{ access_token: string; refresh_token: string; user: any }>("/login", { method: "POST", body: data }),
  register: (data: { email: string; password: string; role: string }) =>
    apiRequest<{ access_token: string; refresh_token: string; user: any }>("/register", { method: "POST", body: data }),
  refreshToken: (refreshToken: string) =>
    apiRequest<{ access_token: string }>("/refresh", { method: "POST", body: { refresh_token: refreshToken } }),
  logout: (token?: string) =>
    apiRequest<void>("/logout", { method: "POST", token }),
  getProfile: (token?: string) =>
    apiRequest<any>("/me", { token }),
};

// Students API
export const studentsApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<Student[]>(`/students?school_id=${schoolId}`, { token }),
  create: (data: Omit<Student, "id">, schoolId: string, token?: string) =>
    apiRequest<Student>("/students", { method: "POST", body: { ...data, school_id: schoolId }, token }),
  update: (id: string, data: Partial<Student>, schoolId: string, token?: string) =>
    apiRequest<Student>(`/students/${id}`, { method: "PUT", body: { ...data, school_id: schoolId }, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/students/${id}`, { method: "DELETE", token }),
};

// Teachers API
export const teachersApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<Teacher[]>(`/teachers?school_id=${schoolId}`, { token }),
  create: (data: Omit<Teacher, "id">, schoolId: string, token?: string) =>
    apiRequest<Teacher>("/teachers", { method: "POST", body: { ...data, school_id: schoolId }, token }),
  update: (id: string, data: Partial<Teacher>, schoolId: string, token?: string) =>
    apiRequest<Teacher>(`/teachers/${id}`, { method: "PUT", body: { ...data, school_id: schoolId }, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/teachers/${id}`, { method: "DELETE", token }),
};

// Classes API
export const classesApi = {
  getBySchool: (schoolId: string, token?: string) =>
    apiRequest<ClassItem[]>(`/classes?school_id=${schoolId}`, { token }),
  create: (data: Omit<ClassItem, "id">, schoolId: string, token?: string) =>
    apiRequest<ClassItem>("/classes", { method: "POST", body: { ...data, school_id: schoolId }, token }),
  update: (id: string, data: Partial<ClassItem>, schoolId: string, token?: string) =>
    apiRequest<ClassItem>(`/classes/${id}`, { method: "PUT", body: { ...data, school_id: schoolId }, token }),
  updateSubjects: (id: string, subjects: string[], token?: string) =>
    apiRequest<ClassItem>(`/classes/${id}/subjects`, { method: "PUT", body: { subjects }, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/classes/${id}`, { method: "DELETE", token }),
};

// Lesson Plans API
export const lessonPlansApi = {
  getByClass: (classNo: string, subject: string, schoolId: string, token?: string) =>
    apiRequest<LessonPlan[]>(`/lesson-plans?classNo=${classNo}&subject=${subject}&school_id=${schoolId}`, { token }),
  create: (data: Omit<LessonPlan, "id">, schoolId: string, token?: string) =>
    apiRequest<LessonPlan>("/lesson-plans", { method: "POST", body: { ...data, school_id: schoolId }, token }),
  update: (id: string, data: Partial<LessonPlan>, schoolId: string, token?: string) =>
    apiRequest<LessonPlan>(`/lesson-plans/${id}`, { method: "PUT", body: { ...data, school_id: schoolId }, token }),
  delete: (id: string, token?: string) =>
    apiRequest<void>(`/lesson-plans/${id}`, { method: "DELETE", token }),
};

// Timetables API
export const timetablesApi = {
  getByClass: (classId: string, schoolId: string, token?: string) =>
    apiRequest<Timetable[]>(`/timetables?class_id=${classId}&school_id=${schoolId}`, { token }),
  create: (data: Omit<Timetable, "id">, schoolId: string, token?: string) =>
    apiRequest<Timetable>("/timetables", { method: "POST", body: { ...data, school_id: schoolId }, token }),
  update: (id: string, data: Partial<Timetable>, schoolId: string, token?: string) =>
    apiRequest<Timetable>(`/timetables/${id}`, { method: "PUT", body: { ...data, school_id: schoolId }, token }),
  generateTeachers: (schoolId: string, token?: string) =>
    apiRequest<any>("/timetables/generate", { method: "POST", body: { school_id: schoolId }, token }),
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
