// Design Ref: §3.2~3.3 — 화면과 계산 함수가 주고받는 데이터의 모양
import type { AbsenceReason, Grade } from "./constants";

// 부재 기간 입력 한 줄 (날짜는 모두 "YYYY-MM-DD" 글자)
export interface AbsenceInput {
  id: string; // 줄 추가·삭제용 식별자
  reason: AbsenceReason | "";
  startDate: string; // 시작일 (신규채용이면 비움)
  returnDate: string; // 복직일 (신규채용이면 비움). 부재일은 복직일 전날까지
  hireDate: string; // 입사일 (신규채용일 때만)
}

// 입력 화면 전체의 값
export interface CalculatorInput {
  year: number; // 계산 연도(학점평가 연도의 끝 해). N = (N-1)-12-01 ~ N-11-30
  grade: Grade | "";
  absences: AbsenceInput[];
  noAbsence: boolean; // "부재 기간 없음" 체크 (체크하면 부재 줄은 계산에 쓰지 않는다)
  completedCredits: string; // 이수 학점 (입력칸 글자 그대로)
}

// 계산 연도 안으로 잘라 합친 부재 한 건
export interface AppliedPeriod {
  reasons: AbsenceReason[]; // 합쳐진 경우 사유가 여러 개일 수 있음 (기록용)
  from: string; // 실제 반영 시작일
  to: string; // 실제 반영 종료일 (복직일 전날, 계산 연도 안으로 잘린 값)
  days: number; // 부재 일수
  clipped: boolean; // 계산 연도 밖이 잘렸는지 → "~만 반영" 표시용
  creditTenths: number; // 인정 학점 × 10 (예: 2.8 → 28)
  mergedCount: number; // 겹쳐서 이 기간 하나로 합쳐진 입력 줄 수 (2 이상이면 겹친 날을 한 번만 센 것)
}

// 계산 연도와 겹치지 않아 계산에서 뺀 부재
export interface OutsidePeriod {
  from: string;
  to: string;
}

export type ResultStatus = "no-obligation" | "achieved" | "in-progress";

// 계산 결과. 학점은 모두 "× 10 한 정수"로 들고 다닌다 (소수 오차 방지)
export interface CalculationResult {
  year: number;
  periodStart: string; // 계산 연도 시작일
  periodEnd: string; // 계산 연도 종료일
  grade: Grade;
  newHireDate: string | null; // 신규채용 입사일 (없으면 null) — 계산 근거에 밝히기 위해 보관
  baseCredits: number; // 기준학점
  daysInYear: 365 | 366;
  periods: AppliedPeriod[];
  outsidePeriods: OutsidePeriod[];
  coveredDays: number; // 겹침을 합친 부재 일수 합계
  fullYearAbsent: boolean; // 연중 내내 부재 (합친 부재 일수 = 1년 일수)
  recognizedTenths: number; // 인정 학점 합계 × 10
  targetTenths: number; // 목표 학점 × 10
  completedTenths: number; // 이수 학점 × 10
  remainingTenths: number; // 남은 학점 × 10
  requiredTenths: number; // 들어야 할 교육 학점 × 10 (0.5 단위 = 5의 배수)
  // 안내 문구 우선순위: 목표 0이면 "no-obligation"이 먼저, 그다음 남은 학점이 0이면 "achieved"
  status: ResultStatus;
  explanation: string[]; // 계산 근거 문장들
}

// 입력 검사 오류 종류 (안내 문구는 validate.ts의 ERROR_MESSAGES)
export type ErrorCode =
  | "GRADE_REQUIRED"
  | "REASON_REQUIRED"
  | "DATE_REQUIRED"
  | "DATE_INVALID"
  | "HIRE_DATE_REQUIRED"
  | "NEW_HIRE_DUPLICATE"
  | "ABSENCE_CHOICE_REQUIRED"
  | "RETURN_NOT_AFTER_START"
  | "CREDITS_REQUIRED"
  | "CREDITS_INVALID";

// 부재 한 줄의 칸별 오류
export interface AbsenceErrors {
  reason?: ErrorCode;
  startDate?: ErrorCode;
  returnDate?: ErrorCode;
  hireDate?: ErrorCode;
  range?: ErrorCode; // 복직일 ≤ 시작일
}

export interface ValidationErrors {
  grade?: ErrorCode;
  absenceChoice?: ErrorCode; // 부재 기간을 입력하지도, "부재 기간 없음"을 체크하지도 않음
  completedCredits?: ErrorCode;
  absences: Record<string, AbsenceErrors>; // 부재 줄 id → 오류
}
