export interface CompanyHoliday {
  _id: string;
  title: string;
  date: string;
  animationUrl: string;
  animationResourceType: 'image' | 'video';
  isDefault?: boolean;
}

export interface HolidayRequest {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  requestCount?: number;
}

export interface GitDay {
  count: number;
}

export type GitWeek = GitDay[];

export interface GitMonth {
  month: string;
  weeks: GitWeek[];
}

export interface GitData {
  months: GitMonth[];
}

export interface AttendanceRecord {
  date: string;
  entryTime?: string;
  exitTime?: string;
}

export interface AttendanceData {
  percentage: number;
  todayEntry: boolean;
  records?: AttendanceRecord[];
}

export interface VerificationSession {
  scheduledAt: string;
  nextRetryAt?: string;
  attempts: any[];
  finalStatus: 'pending' | 'success' | 'suspicious' | 'missed' | null;
}

export interface FaceMatchResult {
  match: boolean;
  success: boolean;
  distance?: number;
  matchType?: "success" | "partial" | "fail";
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  authProviders?: {
    github?: {
      username: string;
    };
  };
}
