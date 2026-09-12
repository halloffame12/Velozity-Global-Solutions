import { useQuery } from '@tanstack/react-query';
import { fetchActivity } from '../lib/apiEndpoints';
import { formatRelativeTime } from '../lib/utils';

export default function Activity() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => fetchActivity(),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const logs = data?.data?.logs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
        <p className="mt-1 text-sm text-gray-600">Recent project activity</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No activity yet</div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user.name}</span>{' '}
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                      {log.task && (
                        <span className="text-gray-600"> on task {log.task.title}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{log.project.name}</span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
