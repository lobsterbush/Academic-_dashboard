// ============================================
// Academic Dashboard - Data Models
// ============================================

// --- Shared Types ---
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Deadline {
  id: string;
  label: string;
  date: string; // ISO date string
  module: "paper" | "grant" | "review" | "teaching" | "conference" | "service" | "student";
  referenceId: string;
  completed: boolean;
}

// --- Papers Pipeline ---
export type PaperStage =
  | "idea"
  | "drafting"
  | "internal-review"
  | "submitted"
  | "under-review"
  | "revise-resubmit"
  | "accepted"
  | "published";

export const PAPER_STAGES: { value: PaperStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "drafting", label: "Drafting" },
  { value: "internal-review", label: "Internal Review" },
  { value: "submitted", label: "Submitted" },
  { value: "under-review", label: "Under Review" },
  { value: "revise-resubmit", label: "Revise & Resubmit" },
  { value: "accepted", label: "Accepted" },
  { value: "published", label: "Published" },
];

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  coAuthors: string[];
  stage: PaperStage;
  targetJournal: string;
  submissionDate: string;
  decisionDate: string;
  notes: string;
  priority: Priority;
  linkedFiles: TrackedFile[];
  createdAt: string;
  updatedAt: string;
}

// --- Teaching ---
export type Semester = "Fall" | "Spring" | "Summer";

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: Semester;
  year: number;
  enrollment: number;
  schedule: string; // e.g. "MWF 10:00-10:50"
  location: string;
  officeHours: string;
  taName: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
}

// --- Grants ---
export type GrantStatus =
  | "planning"
  | "drafting"
  | "submitted"
  | "under-review"
  | "funded"
  | "declined"
  | "completed";

export const GRANT_STATUSES: { value: GrantStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "drafting", label: "Drafting" },
  { value: "submitted", label: "Submitted" },
  { value: "under-review", label: "Under Review" },
  { value: "funded", label: "Funded" },
  { value: "declined", label: "Declined" },
  { value: "completed", label: "Completed" },
];

export interface Grant {
  id: string;
  title: string;
  agency: string;
  amount: number;
  role: string; // PI, Co-PI, etc.
  status: GrantStatus;
  submissionDeadline: string;
  startDate: string;
  endDate: string;
  coInvestigators: string[];
  notes: string;
  linkedFiles: TrackedFile[];
  createdAt: string;
}

// --- Peer Reviews ---
export type ReviewStatus = "pending" | "accepted" | "declined" | "in-progress" | "completed";

export interface PeerReview {
  id: string;
  journal: string;
  manuscriptTitle: string;
  status: ReviewStatus;
  dueDate: string;
  receivedDate: string;
  completedDate: string;
  notes: string;
  linkedFiles: TrackedFile[];
  createdAt: string;
}

export interface EditorialRole {
  id: string;
  journal: string;
  role: string; // e.g. "Associate Editor", "Editorial Board"
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// --- Students & Advising ---
export type StudentLevel = "phd" | "masters" | "undergraduate" | "postdoc";
export type StudentStatus = "active" | "graduated" | "on-leave" | "withdrawn";

export interface Student {
  id: string;
  name: string;
  email: string;
  level: StudentLevel;
  status: StudentStatus;
  program: string;
  dissertationTitle: string;
  startDate: string;
  expectedGraduation: string;
  committeeRole: string; // "chair", "member", "reader"
  notes: string;
  createdAt: string;
}

// --- Conferences ---
export type ConferenceStatus = "considering" | "abstract-submitted" | "accepted" | "registered" | "attended";

export interface Conference {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: ConferenceStatus;
  presentationTitle: string;
  presentationType: string; // "paper", "poster", "panel", "invited"
  submissionDeadline: string;
  registrationDeadline: string;
  travelBooked: boolean;
  notes: string;
  createdAt: string;
}

// --- Service ---
export type ServiceType = "department" | "university" | "professional" | "community";

export interface ServiceRole {
  id: string;
  title: string;
  organization: string;
  type: ServiceType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hoursPerMonth: number;
  notes: string;
  createdAt: string;
}

// --- Settings ---
export type Theme = "light" | "dark" | "system";
export type AccentColor = "indigo" | "blue" | "violet" | "emerald" | "rose" | "amber";

export type DashboardPane =
  | "stats"
  | "papers-pipeline"
  | "deadlines"
  | "teaching"
  | "grants"
  | "reviews"
  | "students"
  | "conferences";

export const DASHBOARD_PANES: { value: DashboardPane; label: string; description: string }[] = [
  { value: "stats", label: "Stat Cards", description: "Summary numbers across all modules" },
  { value: "papers-pipeline", label: "Papers Pipeline", description: "Manuscripts grouped by stage" },
  { value: "deadlines", label: "Upcoming Deadlines", description: "Aggregated deadlines from all modules" },
  { value: "teaching", label: "Active Courses", description: "Currently active teaching" },
  { value: "grants", label: "Grant Summary", description: "Funded and pending grants" },
  { value: "reviews", label: "Pending Reviews", description: "Reviews awaiting completion" },
  { value: "students", label: "Active Students", description: "Current advisees" },
  { value: "conferences", label: "Upcoming Conferences", description: "Conferences you haven't attended yet" },
];

export interface UserSettings {
  theme: Theme;
  accentColor: AccentColor;
  visiblePanes: DashboardPane[];
  screensaverTimeout: number; // minutes, 0 = disabled
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  accentColor: "indigo",
  visiblePanes: ["stats", "papers-pipeline", "deadlines"],
  screensaverTimeout: 5,
};

// --- Todos ---
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// --- Linked Folders & Files ---
export type FolderModule = "papers" | "reviews" | "grants" | "teaching" | "conferences";

export interface LinkedFolder {
  id: string;
  name: string;           // User-friendly label, e.g. "Review PDFs"
  module: FolderModule;
  path: string;           // Display path from directory picker
  notes: string;
  createdAt: string;
}

export interface TrackedFile {
  name: string;
  size: number;
  lastModified: number;   // Unix timestamp
  type: string;           // MIME type, e.g. "application/pdf"
}

// --- Dashboard Store ---
export interface DashboardData {
  papers: Paper[];
  courses: Course[];
  grants: Grant[];
  peerReviews: PeerReview[];
  editorialRoles: EditorialRole[];
  students: Student[];
  conferences: Conference[];
  serviceRoles: ServiceRole[];
  linkedFolders: LinkedFolder[];
  todos: Todo[];
}
