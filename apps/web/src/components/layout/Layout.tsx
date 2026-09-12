import { Outlet } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore, useUIStore } from '../../stores';
import { ROLES } from '@agency/shared';
import { useNotifications, useRealtime } from '../../hooks';

export function Layout() {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, notificationDropdownOpen, setNotificationDropdownOpen } = useUIStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  useRealtime();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`flex ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Menu size={24} />
              </button>
              <div className="hidden lg:block">
                <p className="text-sm text-gray-500">
                  Welcome back, <span className="font-medium text-gray-900">{user?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-4 text-sm text-gray-500 text-center">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>
                      ) : (
                        notifications.slice(0, 10).map((notification: any) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                              !notification.isRead ? 'bg-primary-50' : ''
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-primary-600 hover:text-primary-700"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role || '']}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.DEVELOPER]: 'Developer',
};
