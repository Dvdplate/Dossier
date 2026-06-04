import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { queryKeys } from "../lib/queryKeys.js";
import type { Task, CreateTaskInput, UpdateTaskInput, ReorderInput } from "@dossier/core";

export function useQueue() {
  return useQuery({
    queryKey: queryKeys.queue,
    queryFn: () => api.get<Task[]>("/queue"),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.post<Task>("/tasks", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Task>(`/tasks/${id}/complete`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.queue });
      const previous = queryClient.getQueryData<Task[]>(queryKeys.queue);
      if (previous) {
        queryClient.setQueryData(queryKeys.queue, previous.filter(t => t.id !== id));
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.queue, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}

export function useReorderTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderInput) => api.post<{ success: true }>("/tasks/reorder", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) => api.patch<Task>(`/tasks/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue });
    },
  });
}
