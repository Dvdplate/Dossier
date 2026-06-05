import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { queryKeys } from "../lib/queryKeys.js";

export type DeviceRow = {
  id: string;
  nickname: string;
  createdAt: number;
  isCurrent: boolean;
};

export type CreateDeviceRequest = {
  deviceId: string;
  nickname: string;
  publicKeyJwk: JsonWebKey;
};

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () => api.get<DeviceRow[]>("/devices"),
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeviceRequest) => api.post<DeviceRow>("/devices", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: true }>(`/devices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

