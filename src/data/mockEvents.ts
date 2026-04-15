import eventHero from "@/assets/event-hero.jpg";
import eventHackathon from "@/assets/event-hackathon.jpg";
import eventCareer from "@/assets/event-career.jpg";
import eventSports from "@/assets/event-sports.jpg";
import eventSocial from "@/assets/event-social.jpg";

export type EventCategory = "social" | "academic" | "career" | "sports" | "arts";

export interface OrgProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  followerCount: number;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  category: EventCategory;
  org: OrgProfile;
  date: string;
  time: string;
  location: string;
  attendees: number;
  capacity: number;
  friendsGoing: string[];
  saved: boolean;
  likes: number;
  tags: string[];
}

export const CATEGORIES: { id: EventCategory | "all" | "following"; label: string }[] = [
  { id: "all", label: "For You" },
  { id: "following", label: "Following" },
  { id: "social", label: "Social" },
  { id: "academic", label: "Academic" },
  { id: "career", label: "Career" },
  { id: "sports", label: "Sports" },
  { id: "arts", label: "Arts" },
];

export const mockOrgs: OrgProfile[] = [
  { id: "1", name: "CS Society", handle: "@cssociety", avatar: "CS", verified: true, followerCount: 1240 },
  { id: "2", name: "Career Center", handle: "@careercenter", avatar: "CC", verified: true, followerCount: 3100 },
  { id: "3", name: "Intramural Sports", handle: "@imsports", avatar: "IM", verified: true, followerCount: 2800 },
  { id: "4", name: "Student Union", handle: "@studentunion", avatar: "SU", verified: true, followerCount: 5200 },
  { id: "5", name: "Art Collective", handle: "@artcollective", avatar: "AC", verified: false, followerCount: 680 },
];

export const mockEvents: CampusEvent[] = [
  {
    id: "1",
    title: "Welcome Week Block Party",
    description: "Kick off the semester with live music, free food, and good vibes! Meet new people and reconnect with friends at the biggest event of the fall.",
    image: eventHero,
    category: "social",
    org: mockOrgs[3],
    date: "Fri, Sep 12",
    time: "6:00 PM",
    location: "Main Quad",
    attendees: 342,
    capacity: 500,
    friendsGoing: ["Maya", "Jordan", "Alex"],
    saved: false,
    likes: 1842,
    tags: ["free food", "live music", "outdoor"],
  },
  {
    id: "2",
    title: "24-Hour Hackathon",
    description: "Build something amazing in 24 hours. Teams of 2-4, all skill levels welcome. Prizes include $500, mentorship, and internship interviews.",
    image: eventHackathon,
    category: "academic",
    org: mockOrgs[0],
    date: "Sat, Sep 20",
    time: "10:00 AM",
    location: "Tech Building, Room 301",
    attendees: 89,
    capacity: 120,
    friendsGoing: ["Chris"],
    saved: true,
    likes: 612,
    tags: ["coding", "prizes", "networking"],
  },
  {
    id: "3",
    title: "Fall Career Fair",
    description: "Over 80 companies recruiting for internships and full-time roles. Bring your resume and dress business casual.",
    image: eventCareer,
    category: "career",
    org: mockOrgs[1],
    date: "Wed, Sep 24",
    time: "1:00 PM",
    location: "Student Center Ballroom",
    attendees: 210,
    capacity: 400,
    friendsGoing: ["Maya", "Taylor"],
    saved: false,
    likes: 947,
    tags: ["internships", "networking", "professional"],
  },
  {
    id: "4",
    title: "Volleyball Open Gym",
    description: "Drop-in volleyball every Wednesday. All skill levels welcome — just bring your energy and indoor shoes!",
    image: eventSports,
    category: "sports",
    org: mockOrgs[2],
    date: "Wed, Sep 17",
    time: "7:00 PM",
    location: "Recreation Center, Court 2",
    attendees: 28,
    capacity: 40,
    friendsGoing: ["Jordan", "Sam", "Alex"],
    saved: false,
    likes: 138,
    tags: ["drop-in", "active", "weekly"],
  },
  {
    id: "5",
    title: "Game Night in Blackburn",
    description: "Board games, card games, snacks, and chill vibes. Bring your favorite game or try something new!",
    image: eventSocial,
    category: "social",
    org: mockOrgs[3],
    date: "Fri, Sep 19",
    time: "8:00 PM",
    location: "Blackburn Center Lounge",
    attendees: 45,
    capacity: 60,
    friendsGoing: ["Maya"],
    saved: false,
    likes: 321,
    tags: ["games", "chill", "free"],
  },
];
