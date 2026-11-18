import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvent, fetchEvents, saveNewEvent } from "@/data/repository";

const eventKeys = {
  all: ["events"] as const,
  list: ["events", "list"] as const,
  detail: (id: string | undefined) => ["events", "detail", id] as const,
};

export const useEvents = <T = Awaited<ReturnType<typeof fetchEvents>>>(
  select?: (events: Awaited<ReturnType<typeof fetchEvents>>) => T,
) => useQuery({ queryKey: eventKeys.list, queryFn: fetchEvents, select });

export const useEvent = (id: string | undefined) =>
  useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => (id ? fetchEvent(id) : Promise.resolve(null)),
  });

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveNewEvent,
    onSuccess: async (event) => {
      // Refresh even an inactive list so navigating back shows the new event.
      await queryClient.invalidateQueries({ queryKey: eventKeys.all, refetchType: "all" });
      queryClient.setQueryData(eventKeys.detail(event.id), event);
    },
  });
};
