import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Activity,
  Users,
  Building2,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../stores';
import { ROLES } from '@agency/shared';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER] },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER] },
  { path: '/tasks', label: 'Tasks', icon: ListTodo, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER] },
  { path: '/activity', label: 'Activity', icon: Activity, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER] },
  { path: '/clients', label: 'Clients', icon: Building2, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
  { path: '/users', label: 'Users', icon: Users, roles: [ROLES.ADMIN] },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const filteredNav = navItems.filter(item => (user ? item.roles.includes(user.role) : false));

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Agency</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <Menu size={24} />
        </button>
      </div>

      <nav className="p-4 space-y-1">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
