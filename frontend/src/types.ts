export type UserRole = "employee" | "agent" | "admin";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Person {
  _id: string;
  email: string;
  role: UserRole;
}

export interface TicketComment {
  _id: string;
  text: string;
  author: Person;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Person;
  assignedTo: Person | null;
  comments: TicketComment[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketPage {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
