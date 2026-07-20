// "none" = access revoked (e.g. removed from the HR team) — the Firestore
// user doc is kept for audit history, but the role no longer grants access
// to any dashboard route.
export type Role = "apprentice" | "manager" | "hr" | "none"
export type LeaveStatus = "pending" | "approved" | "rejected"
export type LeaveType = "Casual/Sick Leave" | "Annual Leave" | "Extra Leave (LOP)"

export interface AppUser {
  id: string
  apprenticeId?: string // HR-assigned ID from their HRIS/payroll system, apprentices only
  email: string
  name: string
  role: Role
  managerId?: string
  managerEmail?: string
  managerName?: string
  hireDate: string // ISO date string
  totalLeave: number // default 12
  stipend: number // monthly amount
  createdAt: string
  active?: boolean // undefined or true = active, false = archived (soft-deleted)
  archivedAt?: string | null // ISO date string
  archivedBy?: string | null // HR user ID who archived them
}

export interface LeaveRequest {
  id: string
  apprenticeId: string
  apprenticeName: string
  apprenticeEmail: string
  managerId: string
  managerEmail: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  noOfDays: number
  requestId: string
  status: LeaveStatus
  createdAt: string
  decidedAt?: string
  decisionNote?: string
}

export interface ExtraLeaveRequest {
  id: string
  apprenticeId: string
  apprenticeName: string
  apprenticeEmail: string
  startDate: string
  endDate: string
  noOfDays: number
  reason: string
  requestId: string
  status: LeaveStatus
  lopDays?: number
  deduction?: number
  finalPayment?: number
  createdAt: string
  decidedAt?: string
}

export interface Holiday {
  id: string
  date: string
  name: string
  day: string
  comments?: string
}

export interface PayrollRecord {
  id: string
  apprenticeId: string
  apprenticeName: string
  apprenticeEmail: string
  month: number
  year: number
  stipend: number
  regularLeave: number
  lopDays: number
  deduction: number
  finalPayment: number
  generatedAt: string
}

export interface NotificationItem {
  id: string
  message: string
  meta: string
  href: string
}

export interface StipendSlip {
  id: string
  apprenticeId: string
  month: number
  year: number
  finalPayment: number
  signedAt?: string
  signatureUrl?: string
}
