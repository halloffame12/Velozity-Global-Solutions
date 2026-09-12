import api from './api';

async function unwrap<T>(promise: Promise<{ data: T }>): Promise<any> {
  const response = await promise;
  return response.data;
}

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  dueFrom?: string;
  dueTo?: string;
  projectId?: string;
  limit?: number;
}

export const fetchDashboardStats = () => unwrap(api.get('/dashboard'));
export const fetchProjects = () => unwrap(api.get('/projects'));
export const fetchProject = (id: string) => unwrap(api.get(`/projects/${id}`));
export const fetchTasks = (params?: TaskQueryParams) => unwrap(api.get('/tasks', { params }));
export const fetchTask = (id: string) => unwrap(api.get(`/tasks/${id}`));
export const fetchClients = () => unwrap(api.get('/clients'));
export const fetchClient = (id: string) => unwrap(api.get(`/clients/${id}`));
export const fetchActivity = (params?: { projectId?: string; limit?: number }) =>
  unwrap(api.get('/activity', { params }));
export const fetchNotifications = () => unwrap(api.get('/notifications'));
export const fetchUsers = () => unwrap(api.get('/users'));
export const fetchPresence = () => unwrap(api.get('/users/online'));