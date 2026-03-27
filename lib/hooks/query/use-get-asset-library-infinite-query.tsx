import { getAssetLibrary, GetAssetLibraryRequestTypes } from '@/lib/api/asset';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useGetAssetLibraryInfiniteQuery = (
  filters: Omit<GetAssetLibraryRequestTypes, 'page' | 'size'>
) => {
  return useInfiniteQuery({
    queryKey: ['assets', 'library', filters],
    queryFn: ({ pageParam = 0 }) => getAssetLibrary({ ...filters, page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
  });
};
