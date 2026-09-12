import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '../lib/apiEndpoints';
import { Link } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function Projects() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const projects = data?.data?.projects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg">
          <Plus size={20} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-600">Get started by creating your first project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{project.client.name}</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <span className="text-gray-600">{project._count?.tasks || 0} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
