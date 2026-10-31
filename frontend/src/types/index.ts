export type UserRole = 'ADMIN' | 'MEMBER' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  neptun?: string;
  role: UserRole;
  isActiveMember: boolean;
  position?: string;
  createdAt?: string;
}

export type TrainingType = 'Gyakorlás' | 'Meccs' | 'Szabad edzés';

export interface Participant {
  id: string;
  name: string;
  email?: string;
  registeredAt?: string;
}

export interface Training {
  id: string;
  title: string;
  location: string;
  date: string;
  type: TrainingType;
  maxParticipants: number;
  description?: string;
  participants: Participant[];
  waitlist: Participant[];
}

export type CupCategory = 'Férfi' | 'Női' | 'Vegyes';

export interface CupTeamMember {
  id?: string;
  name: string;
}

export interface CupTeamRegistration {
  id?: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainUserId?: number;
  members?: CupTeamMember[];
  playerCount?: number;
  category: CupCategory;
  edition: string;
  rulesAccepted: boolean;
  status?: string;
  createdAt?: string;
}

export interface CupResultItem {
  placement: number;
  teamName: string;
  category: CupCategory;
  notes?: string;
}

export interface CupEditionResults {
  edition: string;
  date: string;
  results: CupResultItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
