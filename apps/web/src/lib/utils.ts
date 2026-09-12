import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@agency/shared';

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.DEVELOPER]: 'Developer',
};

export const STATUS_LABELS: Record<string, string> = {
  [TASK_STATUS.TODO]: 'Todo',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.IN_REVIEW]: 'In Review',
  [TASK_STATUS.DONE]: 'Done',
};

export const PRIORITY_LABELS: Record<string, string> = {
  [TASK_PRIORITY.LOW]: 'Low',
  [TASK_PRIORITY.MEDIUM]: 'Medium',
  [TASK_PRIORITY.HIGH]: 'High',
  [TASK_PRIORITY.CRITICAL]: 'Critical',
};

export const STATUS_COLORS: Record<string, string> = {
  [TASK_STATUS.TODO]: 'bg-gray-100 text-gray-800',
  [TASK_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TASK_STATUS.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [TASK_STATUS.DONE]: 'bg-green-100 text-green-800',
};

export const PRIORITY_COLORS: Record<string, string> = {
  [TASK_PRIORITY.LOW]: 'text-gray-600',
  [TASK_PRIORITY.MEDIUM]: 'text-blue-600',
  [TASK_PRIORITY.HIGH]: 'text-orange-600',
  [TASK_PRIORITY.CRITICAL]: 'text-red-600',
};

export const ROLE_COLORS: Record<string, string> = {
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
  [ROLES.PROJECT_MANAGER]: 'bg-blue-100 text-blue-800',
  [ROLES.DEVELOPER]: 'bg-green-100 text-green-800',
};

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
