import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProject } from '../lib/apiEndpoints';
import { formatDate, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../lib/utils';
import { useProjectRoom } from '../hooks';
import { TASK_STATUS } from '@agency/shared';

const STATUS_KEY: Record<string, string> = {
  [TASK_STATUS.TODO]: 'todo',
  [TASK_STATUS.IN_PROGRESS]: 'inProgress',
  [TASK_STATUS.IN_REVIEW]: 'inReview',
  [TASK_STATUS.DONE]: 'done',
};

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  });

  useProjectRoom(projectId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const project = data?.data?.project;
  const taskStats = data?.data?.taskStats;

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-primary-600">Projects</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-2 text-gray-600">{project.description || 'No description'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Client</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{project.client?.name}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Project Manager</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{project.createdBy?.name}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Created</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(project.createdAt)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Tasks</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{taskStats?.total || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.values(TASK_STATUS).map((status) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {taskStats?.[STATUS_KEY[status]] ?? 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">{STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <Link to={`/tasks?projectId=${project.id}`} className="text-sm text-primary-600 hover:text-primary-700">
            View all in filter view
          </Link>
        </div>
        {project.tasks?.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No tasks yet</p>
        ) : (
          <div className="space-y-3">
            {project.tasks?.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.assignedDeveloper?.name || 'Unassigned'} • Due {formatDate(task.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {task.isOverdue && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {(project.activityLogs || []).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">No activity yet</p>
          )}
          {(project.activityLogs || []).map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3 text-sm">
              <div className="flex-1">
                <p className="text-gray-900">
                  <span className="font-medium">{activity.user?.name}</span>{' '}
                  {String(activity.action || '').replace(/_/g, ' ').toLowerCase()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}