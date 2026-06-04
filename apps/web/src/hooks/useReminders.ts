import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { queryKeys } from "../lib/queryKeys.js";
import type { RecurringRule, CreateRuleInput, UpdateRuleInput } from "@dossier/core";

export function useReminders() {
  return useQuery({
    queryKey: queryKeys.reminders,
    queryFn: () => api.get<RecurringRule[]>("/reminders"),
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRuleInput) => api.post<RecurringRule>("/reminders", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateRuleInput }) => api.patch<RecurringRule>(`/reminders/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<{ success: true }>(`/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders });
    },
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.patch<RecurringRule>(`/reminders/${id}`, { active }),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reminders });
      const previous = queryClient.getQueryData<RecurringRule[]>(queryKeys.reminders);
      if (previous) {
        queryClient.setQueryData(queryKeys.reminders, previous.map(r => r.id === id ? { ...r, active } : r));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.reminders, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders });
    },
  });
}
