import type { CampusEvent } from "@/data/mockEvents";

const normalizeSearchValue = (value: unknown) =>
  typeof value === "string" ? value.trim().toLocaleLowerCase() : "";

export const searchEvents = (
  events: readonly CampusEvent[],
  rawQuery: string,
): CampusEvent[] => {
  const query = normalizeSearchValue(rawQuery);
  if (!query) return [];

  return events.filter((event) => {
    const tags = Array.isArray(event.tags) ? event.tags : [];
    const searchableValues = [event.title, event.org?.name, event.location, ...tags];

    return searchableValues.some((value) =>
      normalizeSearchValue(value).includes(query),
    );
  });
};
