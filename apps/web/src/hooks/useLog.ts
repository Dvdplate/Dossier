import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { queryKeys } from "../lib/queryKeys.js";
import type { Task } from "@dossier/core";

interface HistoryResponse {
  items: Task[];
  nextCursor: number | null;
}

export function useLog() {
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : "";
      return api.get<HistoryResponse>(`/history${qs}`);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
