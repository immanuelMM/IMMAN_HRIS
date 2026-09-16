export type Role = 'Admin' | 'Employee'

export type Gender = 'Male' | 'Female' | 'Other'
export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated'
export type EducationLevel = 'Secondary' | 'Tertiary' | 'Vocational'

export interface LoginResponse {
  token: string
  role: Role
  displayName: string
}

export interface EducationRecord {
  id: number
  level: EducationLevel
  schoolName: string
  programOrStrand: string | null
  yearGraduated: number | null
  honors: string | null
}

export interface EducationRecordInput {
  level: EducationLevel
  schoolName: string
  programOrStrand: string | null
  yearGraduated: number | null
  honors: string | null
}

export interface EmploymentHistoryRecord {
  id: number
  companyName: string
  position: string
  startDate: string
  endDate: string | null
  reasonForLeaving: string | null
}

export interface EmploymentHistoryInput {
  companyName: string
  position: string
  startDate: string
  endDate: string | null
  reasonForLeaving: string | null
}

export interface DepartmentHistoryRecord {
  id: number
  departmentId: number
  departmentName: string
  position: string
  startDate: string
  endDate: string | null
}

export interface Employee {
  id: number
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  fullName: string
  dateOfBirth: string
  gender: Gender
  civilStatus: CivilStatus
  address: string
  contactNumber: string
  email: string
  hireDate: string
  currentDepartmentId: number | null
  currentDepartmentName: string | null
  username: string | null
  educationRecords: EducationRecord[]
  employmentHistories: EmploymentHistoryRecord[]
  departmentHistories: DepartmentHistoryRecord[]
}

export interface CreateEmployeeRequest {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  dateOfBirth: string
  gender: Gender
  civilStatus: CivilStatus
  address: string
  contactNumber: string
  email: string
  hireDate: string
  departmentId: number
  position: string
  educationRecords: EducationRecordInput[]
  employmentHistories: EmploymentHistoryInput[]
}

export interface UpdateEmployeeRequest {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  dateOfBirth: string
  gender: Gender
  civilStatus: CivilStatus
  address: string
  contactNumber: string
  email: string
  hireDate: string
  educationRecords: EducationRecordInput[]
  employmentHistories: EmploymentHistoryInput[]
}

export interface CreateEmployeeResponse {
  employee: Employee
  generatedUsername: string
  generatedPin: string
}

export interface RegeneratePinResponse {
  username: string
  newPin: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  employeeCount: number
}

export interface AttendanceRecord {
  id: number
  date: string
  timeIn: string | null
  timeOut: string | null
}

export interface AdminAttendanceRecord {
  id: number
  employeeId: number
  employeeName: string
  date: string
  timeIn: string | null
  timeOut: string | null
  dailyHours: number | null
}

export interface WeeklySummary {
  employeeId: number
  employeeName: string
  weekStart: string
  weekEnd: string
  totalHours: number
}

export interface AttendanceMonitoringResponse {
  records: AdminAttendanceRecord[]
  weeklySummaries: WeeklySummary[]
}

export interface Profile {
  id: number
  fullName: string
  email: string
  contactNumber: string
  address: string
  hireDate: string
  currentDepartmentName: string | null
  educationRecords: EducationRecord[]
  employmentHistories: EmploymentHistoryRecord[]
  departmentHistories: DepartmentHistoryRecord[]
}
