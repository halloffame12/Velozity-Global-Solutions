import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../lib/apiEndpoints';
import { formatRelativeTime, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, ROLE_LABELS } from '../lib/utils';
import { useAuthStore } from '../stores';
import { ROLES } from '@agency/shared';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const stats = data?.data || {};
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.PROJECT_MANAGER;
  const isDev = user?.role === ROLES.DEVELOPER;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name} ({ROLE_LABELS[user?.role || '']})
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin || isManager ? (
          <>
            <StatCard title="Total Projects" value={stats.totalProjects ?? 0} />
            <StatCard title="Total Tasks" value={stats.totalTasks ?? 0} />
            <StatCard title="Due Now / Overdue" value={stats.overdueCount ?? 0} />
            <StatCard title="In Review" value={stats.taskStats?.inReview ?? 0} />
          </>
        ) : (
          <>
            <StatCard title="My Tasks" value={stats.totalTasks ?? 0} />
            <StatCard title="Task Progress" value={stats.taskStats?.done ?? 0} />
            <StatCard title="Due Now / Overdue" value={stats.overdueCount ?? 0} />
            <StatCard title="High / Critical" value={(stats.priorityStats?.high ?? 0) + (stats.priorityStats?.critical ?? 0)} />
          </>
        )}
        {isAdmin && <StatCard title="Online Users" value={stats.onlineUsersCount ?? 0} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Status</h2>
          <div className="space-y-3">
            <StatusBar label="Todo" count={stats.taskStats?.todo || 0} total={stats.totalTasks || 1} color="bg-gray-500" />
            <StatusBar label="In Progress" count={stats.taskStats?.inProgress || 0} total={stats.totalTasks || 1} color="bg-blue-500" />
            <StatusBar label="In Review" count={stats.taskStats?.inReview || 0} total={stats.totalTasks || 1} color="bg-yellow-500" />
            <StatusBar label="Done" count={stats.taskStats?.done || 0} total={stats.totalTasks || 1} color="bg-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <ActivityList items={stats.recentActivity || []} />
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Online Team Members ({stats.onlineUsersCount ?? 0})
          </h2>
          {!stats.onlineUsers?.length ? (
            <p className="text-sm text-gray-500">No one else is online right now.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(stats.onlineUsers || []).map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                  <span className="text-xs text-gray-500">{entry.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isManager && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Due in the Next 7 Days</h2>
          {(stats.upcomingDueTasks || []).length === 0 ? (
            <p className="text-sm text-gray-500">No tasks due in the next week.</p>
          ) : (
            <ul className="space-y-2">
              {(stats.upcomingDueTasks || []).map((task: any) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{task.title}</span>
                  <span className="text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isDev && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
          </div>
          {(stats.tasks || []).length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No tasks assigned to you.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(stats.tasks || []).map((task: any) => (
                <div key={task.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.isOverdue && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ActivityList({ items }: { items: any[] }) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No recent activity.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((activity: any) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user?.name}</span>{' '}
              {String(activity.action || '').replace(/_/g, ' ').toLowerCase()}
              {activity.task && <span className="text-gray-600"> on {activity.task.title}</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {activity.project?.name} • {formatRelativeTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}