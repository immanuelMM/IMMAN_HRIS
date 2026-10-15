export type Role = 'Admin' | 'Employee'

export type IdCardTemplate = 'wave' | 'arch' | 'chevron' | 'stripe' | 'custom'
export type CardOrientation = 'horizontal' | 'vertical'

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

export interface ChurchAndPersonalFields {
  churchLocal: string | null
  churchDistrict: string | null
  churchProvince: string | null
  churchRegion: string | null
  churchPosition: string | null
  parentReligion: string | null
  sabbathDate: string | null
  skillsExpertise: string | null
  healthCondition: string | null
  emergencyContactName: string | null
  emergencyContactNumber: string | null
  emergencyContactAddress: string | null
  sssNumber: string | null
  philHealthNumber: string | null
  tinNumber: string | null
}

export interface Employee extends ChurchAndPersonalFields {
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
  currentDepartmentColor: string | null
  currentDepartmentColorSecondary: string | null
  currentDepartmentHasLogo: boolean
  currentDepartmentIdCardTemplate: IdCardTemplate
  currentDepartmentCardOrientation: CardOrientation
  username: string | null
  hasPhoto: boolean
  educationRecords: EducationRecord[]
  employmentHistories: EmploymentHistoryRecord[]
  departmentHistories: DepartmentHistoryRecord[]
}

export interface CreateEmployeeRequest extends ChurchAndPersonalFields {
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

export interface UpdateEmployeeRequest extends ChurchAndPersonalFields {
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

export type PinDeliveryChannel = 'phone' | 'email'

export interface RegeneratePinResponse {
  username: string
  newPin: string
  deliveryChannel: PinDeliveryChannel | null
  deliveryDestination: string | null
  delivered: boolean
  deliveryNote: string
}

export interface DepartmentPosition {
  id: number
  title: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  employeeCount: number
  teamColor: string | null
  teamColorSecondary: string | null
  hasLogo: boolean
  idCardTemplate: IdCardTemplate
  cardOrientation: CardOrientation
  positions: DepartmentPosition[]
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

export interface Profile extends ChurchAndPersonalFields {
  id: number
  fullName: string
  email: string
  contactNumber: string
  address: string
  hireDate: string
  dateOfBirth: string
  gender: Gender
  civilStatus: CivilStatus
  currentDepartmentId: number | null
  currentDepartmentName: string | null
  currentDepartmentColor: string | null
  currentDepartmentColorSecondary: string | null
  currentDepartmentHasLogo: boolean
  currentDepartmentIdCardTemplate: IdCardTemplate
  currentDepartmentCardOrientation: CardOrientation
  hasPhoto: boolean
  educationRecords: EducationRecord[]
  employmentHistories: EmploymentHistoryRecord[]
  departmentHistories: DepartmentHistoryRecord[]
}

export interface EmployeeQrToken {
  employeeId: number
  token: string
}

export interface ScanAttendanceResult {
  employeeId: number
  employeeName: string
  departmentName: string | null
  hasPhoto: boolean
  action: 'time-in' | 'time-out'
  time: string
  message: string
}
