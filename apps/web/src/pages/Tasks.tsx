import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchTasks, fetchProjects, fetchUsers, TaskQueryParams } from '../lib/apiEndpoints';
import api from '../lib/api';
import { useAuthStore } from '../stores';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@agency/shared';
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate } from '../lib/utils';
import { Plus, X } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.PROJECT_MANAGER;

  const params = useMemo<TaskQueryParams>(() => {
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const dueFrom = searchParams.get('dueFrom') || undefined;
    const dueTo = searchParams.get('dueTo') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    return { status, priority, dueFrom, dueTo, projectId };
  }, [searchParams]);

  const setFilter = (key: string, value: string) => {
    if (key === 'all') {
      setSearchParams(new URLSearchParams());
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">Filter by status, priority, or due window</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            <Plus size={20} />
            New Task
          </button>
        )}
      </div>

      <TaskFilters params={params} setFilter={setFilter} />

      <TaskList params={params} />

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function TaskFilters({ params, setFilter }: { params: TaskQueryParams; setFilter: (k: string, v: string) => void }) {
  const inputCls = "text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-end gap-3">
      <FilterSelect label="Status" value={params.status || ''} onChange={(v) => setFilter('status', v)} options={STATUS_OPTIONS} />
      <FilterSelect label="Priority" value={params.priority || ''} onChange={(v) => setFilter('priority', v)} options={PRIORITY_OPTIONS} />
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Due From</span>
        <input type="date" className={inputCls} value={params.dueFrom || ''} onChange={(e) => setFilter('dueFrom', e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Due To</span>
        <input type="date" className={inputCls} value={params.dueTo || ''} onChange={(e) => setFilter('dueTo', e.target.value)} />
      </label>
      <button
        onClick={() => setFilter('all', '')}
        className="text-sm text-primary-600 hover:text-primary-700 px-2 py-2"
      >
        Clear filters
      </button>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

const STATUS_OPTIONS = Object.entries(TASK_STATUS).map(([, value]) => ({ value, label: STATUS_LABELS[value] }));
const PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY).map(([, value]) => ({ value, label: PRIORITY_LABELS[value] }));

function TaskList({ params }: { params: TaskQueryParams }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => fetchTasks(params),
  });
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      await api.put(`/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const tasks = data?.data?.tasks || [];
  const stats = data?.data?.stats;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {stats && (
        <div className="px-6 py-3 border-b border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>Total: <b>{stats.total}</b></span>
          <span>Todo: <b>{stats.todo}</b></span>
          <span>In Progress: <b>{stats.inProgress}</b></span>
          <span>In Review: <b>{stats.inReview}</b></span>
          <span>Done: <b>{stats.done}</b></span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No tasks match these filters</td>
              </tr>
            ) : (
              tasks.map((task: any) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {task.title}
                      {task.isOverdue && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={task.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(task.dueDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.assignedDeveloper?.name || 'Unassigned'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedDeveloperId, setAssignedDeveloperId] = useState('');
  const [priority, setPriority] = useState('MEDIUM' as string);
  const [dueDate, setDueDate] = useState('');
  const { user } = useAuthStore();

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers, enabled: !!user });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/tasks', {
        title,
        projectId,
        assignedDeveloperId,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const projects = projectsQuery.data?.data?.projects || [];
  const developers = (usersQuery.data?.data?.users || []).filter((u: any) => u.role === ROLES.DEVELOPER);

  const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input required className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Project</span>
            <select required className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Assigned Developer</span>
            <select required className={inputCls} value={assignedDeveloperId} onChange={(e) => setAssignedDeveloperId(e.target.value)}>
              <option value="">Select developer</option>
              {developers.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Priority</span>
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Due Date</span>
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}