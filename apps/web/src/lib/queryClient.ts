import { QueryClient, QueryFunction } from '@tanstack/react-query';
import api from '../lib/api';

const queryFn: QueryFunction = async ({ queryKey }) => {
  const response = await api.get(queryKey.join('/'));
  return response.data;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn,
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 5 * 1000,
    },
  },
});
