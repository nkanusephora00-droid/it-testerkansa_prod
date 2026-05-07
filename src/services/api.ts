import axios from "axios";

// Use relative URL in development (proxy handles it), full URL in production
const API_URL = process.env.NODE_ENV === 'development'
  ? ''
  : (process.env.REACT_APP_API_URL || "https://backend-java-pkn3.onrender.com");

// TypeScript interfaces for API data
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface Application {
  id: number;
  nom: string;
  description?: string;
  version?: string;
  environnement?: string;
  dateCreation?: string;
  createdBy?: number;
}

export interface ApplicationInfoDTO {
  id: number;
  nom: string;
}

export interface Compte {
  id: number;
  applicationId: number;
  username: string;
  code?: string;
  role?: string;
  commentaire?: string;
  createdBy?: number;
  application?: ApplicationInfoDTO;
}

export interface Test {
  id: number;
  sessionId?: number;
  applicationId?: number;
  applicationNom?: string;
  version?: string;
  environnement?: string;
  fonction: string;
  precondition: string;
  etapes: string;
  resultatAttendu: string;
  resultatObtenu: string;
  statut: string;
  commentaires: string;
  image?: string;
}

export interface TestSession {
  id: number;
  nom: string;
  description?: string;
  applicationId?: number;
  applicationNom?: string;
  environnement?: string;
  version?: string;
  nom_document?: string;
  date_creation: string;
  statut: string;
  created_by?: number;
  createdByUsername?: string;
  tests: Test[];
  total_tests: number;
  tests_ok: number;
  tests_bug: number;
  tests_en_cours: number;
}

export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApkFile {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  version?: string;
  packageName?: string;
  description?: string;
  applicationId?: number;
  uploadedBy?: number;
  uploadDate: string;
  downloadCount?: number;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  createdAt: string;
}

export interface UserWithTodos {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  profilePhoto: string;
  createdAt: string;
  todos: Todo[];
}

export interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (process.env.NODE_ENV === 'development') {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur API:", error.message);
    }
    
    // Handle 429 Too Many Requests - retry with delay (sauf pour /auth/*)
    if (error.response?.status === 429) {
      // Ne pas retry pour les requêtes d'authentification
      const isAuthRequest = error.config?.url?.includes('/auth/');
      
      if (!isAuthRequest) {
        const retryCount = error.config._retryCount || 0;
        const maxRetries = 2;
        
        if (retryCount < maxRetries) {
          error.config._retryCount = retryCount + 1;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return api.request(error.config);
        }
      }
    }
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/token", { username, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/auth/reset-password", { token, newPassword });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get("/users", { 
      params: { page: 0, size: 1000, sortBy: 'id', sortDir: 'asc' } 
    });
    return response.data.content || response.data;
  },
  getAvailable: async () => (await api.get<User[]>("/users/available")).data,
  getById: async (id: number) => (await api.get<User>(`/users/${id}`)).data,
  create: async (data: Partial<User>) => (await api.post<User>("/users", data)).data,
  update: async (id: number, data: Partial<User>) => (await api.put<User>(`/users/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/users/${id}`)).data,
  toggleStatus: async (id: number) => (await api.patch<User>(`/users/${id}/toggle-status`)).data,
};

// Profile API
export const profileAPI = {
  getMe: async () => (await api.get<User>("/users/me")).data,
  updateMe: async (data: Partial<User>) => (await api.put<User>("/users/me", data)).data,
  changePassword: async (oldPassword: string, newPassword: string) => 
    (await api.put("/users/me/password", { oldPassword, newPassword })).data,
};

// Applications API
export const applicationsAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'id', sortDir = 'asc') => {
    const response = await api.get<PageResponse<Application>>("/applications", {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.content;
  },
  getById: async (id: number) => (await api.get<Application>(`/applications/${id}`)).data,
  create: async (data: Partial<Application>) => (await api.post<Application>("/applications", data)).data,
  update: async (id: number, data: Partial<Application>) => (await api.put<Application>(`/applications/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/applications/${id}`)).data,
};

// Comptes API
export const comptesAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'id', sortDir = 'asc') => {
    const response = await api.get<PageResponse<Compte>>("/comptes", {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.content;
  },
  getById: async (id: number) => (await api.get<Compte>(`/comptes/${id}`)).data,
  create: async (data: Partial<Compte>) => (await api.post<Compte>("/comptes", data)).data,
  update: async (id: number, data: Partial<Compte>) => (await api.put<Compte>(`/comptes/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/comptes/${id}`)).data,
};

// APK API
export const apkAPI = {
  getAll: async () => (await api.get<ApkFile[]>("/apk")).data,
  getById: async (id: number) => (await api.get<ApkFile>(`/apk/${id}`)).data,
  getByApplication: async (applicationId: number) => (await api.get<ApkFile[]>(`/apk/application/${applicationId}`)).data,
  upload: async (file: File, applicationId?: number, version?: string, packageName?: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (applicationId) formData.append('applicationId', applicationId.toString());
    if (version) formData.append('version', version);
    if (packageName) formData.append('packageName', packageName);
    if (description) formData.append('description', description);
    const response = await api.post<ApkFile>("/apk/upload", formData);
    return response.data;
  },
  download: async (id: number) => {
    const response = await api.get(`/apk/download/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  delete: async (id: number) => (await api.delete(`/apk/${id}`)).data,
};

// Tests API
export const testsAPI = {
  getAll: async (sessionId?: number) => {
    const params = sessionId ? { sessionId } : {};
    return (await api.get<Test[]>("/tests", { params })).data;
  },
  create: async (data: Partial<Test>) => (await api.post<Test>("/tests", data)).data,
  update: async (id: number, data: Partial<Test>) => (await api.put<Test>(`/tests/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/tests/${id}`)).data,
};

// Test Sessions API
export const testSessionsAPI = {
  getAll: async () => (await api.get<TestSession[]>("/test-sessions")).data,
  create: async (data: Partial<TestSession>) => (await api.post<TestSession>("/test-sessions", data)).data,
  update: async (id: number, data: Partial<TestSession>) => (await api.put<TestSession>(`/test-sessions/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/test-sessions/${id}`)).data,
};

// Todos API
export const todosAPI = {
  getAll: async () => (await api.get<Todo[]>("/todos")).data,
  getById: async (id: number) => (await api.get<Todo>(`/todos/${id}`)).data,
  create: async (data: Partial<Todo>) => (await api.post<Todo>("/todos", data)).data,
  update: async (id: number, data: Partial<Todo>) => (await api.put<Todo>(`/todos/${id}`, data)).data,
  delete: async (id: number) => (await api.delete(`/todos/${id}`)).data,
  toggle: async (id: number) => (await api.patch(`/todos/${id}/toggle`)).data,
  getUsersWithTodos: async () => (await api.get<UserWithTodos[]>("/todos/users")).data,
};

// Messages API
export const messagesAPI = {
  getAll: async () => (await api.get<Message[]>("/messages")).data,
  getConversation: async (userId: number) => (await api.get<Message[]>(`/messages/conversation/${userId}`)).data,
  create: async (data: { receiverId: number; content: string }) => (await api.post<Message>("/messages", data)).data,
  markAsRead: async (messageId: number) => (await api.patch(`/messages/${messageId}/read`)).data,
  getUnreadCount: async () => (await api.get<number>("/messages/unread-count")).data,
  getUnreadByUser: async () => (await api.get<Record<number, number>>("/messages/unread-by-user")).data,
};

export default api;