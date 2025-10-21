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
  fromWorker?: boolean; // 标记是否从Worker获取（无法删除）
}

export interface UploadTask {
  id: string;
  file: File;
  status: 'waiting' | 'uploading' | 'syncing' | 'completed' | 'error';
  progress: number; // 0-100
  serverProgress: number; // 上传到服务器的进度 0-100
  cloudProgress: number; // 上传到云端的进度 0-100
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface Attendance {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radius: number;
  penaltyPoints: number;
  createdBy: number;
  createdByUsername?: string;
  createdAt: string;
  notificationSent: boolean;
  completed: boolean;
  signedCount?: number;
  hasSigned?: boolean;
  signedAt?: string;
  mySignedAt?: string;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  attendanceId: number;
  userId: number;
  username: string;
  name: string;
  studentId: string;
  latitude: number;
  longitude: number;
  signedAt: string;
}

