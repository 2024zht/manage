export interface User {
  id: number;
  username: string;
  name: string;
  studentId: string;
  className: string;
  email: string;
  isAdmin: boolean;
  points: number;
  createdAt: string;
}

export interface Rule {
  id: number;
  name: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface PointLog {
  id: number;
  userId: number;
  points: number;
  reason: string;
  createdBy: number;
  createdByUsername: string;
  createdAt: string;
}

export interface PointRequest {
  id: number;
  userId: number;
  username: string;
  name: string;
  studentId: string;
  className: string;
  points: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: number;
  respondedByUsername?: string;
  adminComment?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Leave {
  id: number;
  userId: number;
  username?: string;
  name?: string;
  studentId?: string;
  leaveType: string;
  startTime: string;
  endTime: string;
  duration: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: number;
  respondedByUsername?: string;
  rejectReason?: string;
}

export interface Ebook {
  id?: number;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedBy?: number;
  uploadedByUsername?: string;
  uploadedAt: string;
  b2Synced: boolean;
  b2Path?: string;
}

