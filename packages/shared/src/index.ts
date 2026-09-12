export const ROLES = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  tasks: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  assignedDeveloperId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  assignedDeveloper?: {
    id: string;
    name: string;
    email: string;
  };
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string | null;
  userId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  overdueCount: number;
  taskStats: {
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recentActivity: ActivityLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
