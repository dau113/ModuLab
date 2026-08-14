export type UserRole = 'hs' | 'gv';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  classCode: string;
  teamCode: string;
}

export type LabStep = 'theory' | 'prep' | 'tools' | 'quiz' | 'circuit' | 'report';

export interface LabModule {
  id: string;
  title: string;
  description: string;
  theoryContent: string;
  videoUrl?: string;
  maxErrorThreshold: number; // e.g. 0.10 for 10%
  verifiedBy: string;
  verifiedDate: string;
  referenceSource: string;
  status: 'nhap' | 'da_duyet';
}

export interface ToolMode {
  id: string;
  name: string;
  label: string;
  desc: string;
  safeUsage: string;
  warning?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: 'meter' | 'component' | 'source';
  shortDesc: string;
  detailedDesc: string;
  modes?: ToolMode[];
  safetyWarning?: string;
  errorReading: string;
  iconName: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  options: QuizOption[];
  explanation: string;
  timeLimit: number;
}

export type CircuitComponentType = 'battery' | 'resistor' | 'switch' | 'ammeter' | 'voltmeter' | 'bulb';

export interface CircuitComponent {
  id: string;
  type: CircuitComponentType;
  label: string;
  x: number;
  y: number;
  value?: string;
  status?: 'normal' | 'error' | 'warning';
}

export interface WireConnection {
  id: string;
  from: string; // format: "compId-portName" e.g., "BAT1-pos"
  to: string;   // format: "compId-portName" e.g., "SW1-a"
}

export interface CircuitTestResult {
  status: 'untested' | 'correct' | 'suboptimal' | 'wrong' | 'danger';
  title: string;
  messages: string[];
  dangerous?: boolean;
}

export interface LabReportRow {
  id: number;
  u: number;
  uUnit: 'V' | 'mV';
  i: number;
  iUnit: 'A' | 'mA';
  rCalc: number;
}

export interface LabReportData {
  rows: LabReportRow[];
  avgR: number;
  expectedR: number;
  relativeError: number;
  passed: boolean;
  teacherComment?: string;
}

export interface TeacherClassStats {
  classCode: string;
  className: string;
  totalStudents: number;
  quizCompleted: number;
  reportsSubmitted: number;
  errorStats: { question: string; wrongCount: number }[];
  studentList: {
    id: string;
    name: string;
    team: string;
    quizScore: number | null;
    reportStatus: 'Chưa nộp' | 'Đạt' | 'Chưa đạt';
  }[];
}
