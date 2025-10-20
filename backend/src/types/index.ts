export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
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
  createdAt: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

