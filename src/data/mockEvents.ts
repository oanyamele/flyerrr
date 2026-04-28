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
    image: "/flyers/welcome-week-block-party.png",
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
    image: "/flyers/hack-howard-24h.png",
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
    image: "/flyers/fall-career-fair.png",
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
    image: "/flyers/volleyball-open-gym.png",
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
  {
    id: "6",
    title: "Poetry Slam Open Mic",
    description: "Bring your own piece or cheer on campus performers at this spoken-word night with live music between sets.",
    image: "/flyers/poetry-slam-open-mic.png",
    category: "arts",
    org: mockOrgs[4],
    date: "Thu, Oct 2",
    time: "7:30 PM",
    location: "Fine Arts Black Box",
    attendees: 76,
    capacity: 120,
    friendsGoing: ["Maya", "Ari"],
    saved: false,
    likes: 408,
    tags: ["spoken word", "open mic", "creative"],
  },
  {
    id: "7",
    title: "LinkedIn + Resume Lab",
    description: "Drop in for profile audits, resume edits, and recruiter-backed tips before internship season opens.",
    image: "/flyers/linkedin-resume-lab.png",
    category: "career",
    org: mockOrgs[1],
    date: "Mon, Oct 6",
    time: "4:00 PM",
    location: "Career Center Lab",
    attendees: 112,
    capacity: 180,
    friendsGoing: ["Jordan"],
    saved: true,
    likes: 530,
    tags: ["resume", "linkedin", "internships"],
  },
  {
    id: "8",
    title: "Sunrise Fitness Bootcamp",
    description: "Start your day with guided cardio and core circuits. Water and recovery snacks included.",
    image: "/flyers/sunrise-fitness-bootcamp.png",
    category: "sports",
    org: mockOrgs[2],
    date: "Tue, Oct 7",
    time: "6:30 AM",
    location: "Yard Lawn",
    attendees: 51,
    capacity: 90,
    friendsGoing: ["Sam", "Chris"],
    saved: false,
    likes: 287,
    tags: ["morning", "fitness", "wellness"],
  },
  {
    id: "9",
    title: "AI Study Jam",
    description: "Hands-on group study session focused on prompt design, model evaluation, and project demos.",
    image: "/flyers/ai-study-jam-2026.png",
    category: "academic",
    org: mockOrgs[0],
    date: "Wed, Oct 8",
    time: "5:30 PM",
    location: "Tech Building, Room 214",
    attendees: 134,
    capacity: 170,
    friendsGoing: ["Taylor", "Alex", "Maya"],
    saved: false,
    likes: 721,
    tags: ["ai", "study group", "project help"],
  },
  {
    id: "10",
    title: "Homecoming Kickoff Mixer",
    description: "Food trucks, DJ sets, and student org pop-ups to launch Homecoming week together.",
    image: "/flyers/homecoming-kickoff-mixer.png",
    category: "social",
    org: mockOrgs[3],
    date: "Fri, Oct 10",
    time: "8:00 PM",
    location: "Main Quad",
    attendees: 398,
    capacity: 650,
    friendsGoing: ["Maya", "Jordan", "Chris"],
    saved: false,
    likes: 2012,
    tags: ["homecoming", "music", "food trucks"],
  },
];
