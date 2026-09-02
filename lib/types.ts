export type Role = "admin" | "employee";
export type LeaveStatus = "pending" | "approved" | "declined";

export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  mobile_number: string | null;
  birthday: string | null;
  skip_next_accrual: boolean;
  created_at: string;
};

export type LeaveType = {
  id: string;
  name: string;
  is_active: boolean;
};

export type LeaveBalance = {
  id: string;
  user_id: string;
  leave_type_id: string;
  allocated_days: number;
  used_days: number;
};

export type LeaveRequest = {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
};

export type ShiftColor = "blue" | "purple" | "fuchsia" | "green" | "orange";

export type ShiftType = {
  id: string;
  name: string;
  color: ShiftColor;
  is_active: boolean;
};

export type Schedule = {
  id: string;
  user_id: string;
  shift_type_id: string;
  date: string;
  notes: string | null;
  assigned_by: string | null;
  created_at: string;
};
