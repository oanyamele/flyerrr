import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvent, fetchEvents, saveNewEvent } from "@/data/repository";
import { useAuth } from "@/contexts/AuthContext";

const eventKeys = {
  all: ["events"] as const,
  list: (userId: string | undefined) => ["events", userId, "list"] as const,
  detail: (userId: string | undefined, id: string | undefined) => ["events", userId, "detail", id] as const,
};

export const useEvents = <T = Awaited<ReturnType<typeof fetchEvents>>>(
  select?: (events: Awaited<ReturnType<typeof fetchEvents>>) => T,
) => {
  const { auth } = useAuth();
  return useQuery({ queryKey: eventKeys.list(auth.userId), queryFn: fetchEvents, select });
};

export const useEvent = (id: string | undefined) => {
  const { auth } = useAuth();
  return useQuery({
    queryKey: eventKeys.detail(auth.userId, id),
    queryFn: () => (id ? fetchEvent(id) : Promise.resolve(null)),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { auth } = useAuth();

  return useMutation({
    mutationFn: saveNewEvent,
    onSuccess: async (event) => {
      // Refresh even an inactive list so navigating back shows the new event.
      await queryClient.invalidateQueries({ queryKey: eventKeys.all, refetchType: "all" });
      queryClient.setQueryData(eventKeys.detail(auth.userId, event.id), event);
    },
  });
};
