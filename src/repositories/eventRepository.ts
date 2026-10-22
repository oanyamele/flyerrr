import type { EventRecord, UserRole } from "@/data/appDatabase";
import { mockOrgs, type OrgProfile } from "@/data/mockEvents";
import type { DatabasePort } from "./databasePort";
import type { CreateEventInput, EventRepository } from "./contracts";

const nowIso = () => new Date().toISOString();

const resolveOrg = (role: UserRole, name: string): OrgProfile => {
  if (role !== "org_officer") return mockOrgs[0];
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OF";

  return {
    id: `org-${Date.now()}`,
    name: `${name} Org`,
    handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
    avatar: initials,
    verified: false,
    followerCount: 0,
  };
};

export const createEventRepository = (db: DatabasePort): EventRepository => ({
  list: () => db.read().events,

  create(input: CreateEventInput) {
    const database = db.read();
    const event: EventRecord = {
      id: `event-${Date.now()}`,
      title: input.title,
      description: input.description,
      image: input.image,
      category: input.category,
      org: resolveOrg(input.creatorRole, input.creatorName),
      date: input.date,
      time: input.time,
      location: input.location,
      attendees: 0,
      capacity: input.capacity || 100,
      friendsGoing: [],
      saved: false,
      likes: 0,
      tags: input.tags,
      createdAt: nowIso(),
      createdByUserId: input.creatorUserId,
    };

    db.save({ ...database, events: [event, ...database.events] });
    return event;
  },
});
