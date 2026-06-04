import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { queryKeys } from "../lib/queryKeys.js";
import type { Birthday, CreateBirthdayInput, UpdateBirthdayInput } from "@dossier/core";

export interface MonthGroup {
  month: number;
  contacts: Birthday[];
}

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.birthdays,
    queryFn: () => api.get<MonthGroup[]>("/birthdays?grouped=true"),
  });
}

export function useUpcomingBirthdays(days = 7) {
  return useQuery({
    queryKey: [...queryKeys.birthdaysUpcoming, days],
    queryFn: () => api.get<Birthday[]>(`/birthdays/upcoming?days=${days}`),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBirthdayInput) => api.post<Birthday>("/birthdays", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays });
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdaysUpcoming });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBirthdayInput }) => api.patch<Birthday>(`/birthdays/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays });
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdaysUpcoming });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<{ success: true }>(`/birthdays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays });
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdaysUpcoming });
    },
  });
}
