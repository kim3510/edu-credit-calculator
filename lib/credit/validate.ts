// Design Ref: §6 — 계산하기를 누를 때 입력값을 검사한다. 문제가 있으면 계산하지 않고 칸 옆에 문구를 보여준다.
import { NEW_HIRE_REASON, GRADES } from "./constants";
import { dateToDayNumber } from "./date";
import type { AbsenceErrors, CalculatorInput, ErrorCode, ValidationErrors } from "./types";

// 안내 문구 (복직일 문구는 PRD 5장 원문)
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  GRADE_REQUIRED: "직급을 선택해 주세요",
  REASON_REQUIRED: "부재 사유를 선택해 주세요",
  DATE_REQUIRED: "시작일과 복직일을 모두 입력해 주세요",
  DATE_INVALID: "날짜를 올바르게 입력해 주세요 (예: 2026-03-01)",
  HIRE_DATE_REQUIRED: "입사일을 입력해 주세요",
  NEW_HIRE_DUPLICATE: "신규채용은 한 번만 입력할 수 있습니다. 다른 줄은 삭제하거나 사유를 바꿔 주세요",
  ABSENCE_CHOICE_REQUIRED: "부재 기간을 입력하거나 '부재 기간 없음'을 체크해 주세요",
  RETURN_NOT_AFTER_START: "복직일은 시작일보다 뒤여야 합니다",
  CREDITS_REQUIRED: "이수 학점을 입력해 주세요 (아직 없으면 0을 입력)",
  CREDITS_INVALID: "이수 학점은 숫자로, 0 이상 0.5 단위로 입력해 주세요 (예: 1.5 — 쉼표·글자는 쓸 수 없습니다)",
};

// 이수 학점 글자 → 학점 × 10 (정수). 0 이상 0.5 단위가 아니면 null
// "1.5", "1.50", ".5"처럼 같은 값을 다르게 적은 것은 받아 준다. 소수는 둘째 자리까지만 읽고,
// 0.5 단위가 아닌 값(1.3, 1.25)은 아래에서 걸러낸다. 쉼표·전각 숫자·글자가 섞이면 받지 않는다.
export function parseCompletedTenths(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "" || !/^(\d{1,3})?(\.\d{1,2})?$/.test(trimmed)) return null;
  const hundredths = Math.round(Number(trimmed) * 100); // 0.01학점 단위 정수
  return hundredths % 50 === 0 ? hundredths / 10 : null;
}

// 날짜 칸 하나 검사: 비었으면 "필수" 코드, 형식이 틀리면 "올바르지 않음" 코드
function checkDate(text: string, requiredCode: ErrorCode): ErrorCode | undefined {
  if (text === "") return requiredCode;
  return dateToDayNumber(text) === null ? "DATE_INVALID" : undefined;
}

export function validateInput(input: CalculatorInput): ValidationErrors {
  const errors: ValidationErrors = { absences: {} };

  if (input.grade === "" || !GRADES.includes(input.grade)) errors.grade = "GRADE_REQUIRED";

  // "부재 기간 없음"을 체크하면 부재 줄은 검사하지 않는다. 체크하지 않았는데 줄도 없으면 선택을 요구한다
  // (부재가 있는 사람이 입력을 깜빡하고 부재 없이 계산되는 것을 막기 위함)
  const absences = input.noAbsence ? [] : input.absences;
  if (!input.noAbsence && input.absences.length === 0) errors.absenceChoice = "ABSENCE_CHOICE_REQUIRED";

  let newHireSeen = false; // 신규채용은 입사일이 하나뿐이므로 한 줄만 허용한다
  for (const absence of absences) {
    const found: AbsenceErrors = {};
    if (absence.reason === "") found.reason = "REASON_REQUIRED";

    if (absence.reason === NEW_HIRE_REASON) {
      if (newHireSeen) found.reason = "NEW_HIRE_DUPLICATE";
      newHireSeen = true;
      found.hireDate = checkDate(absence.hireDate, "HIRE_DATE_REQUIRED");
    } else {
      found.startDate = checkDate(absence.startDate, "DATE_REQUIRED");
      found.returnDate = checkDate(absence.returnDate, "DATE_REQUIRED");
      const startDay = dateToDayNumber(absence.startDate);
      const returnDay = dateToDayNumber(absence.returnDate);
      if (startDay !== null && returnDay !== null && returnDay <= startDay) {
        found.range = "RETURN_NOT_AFTER_START";
      }
    }

    // 오류가 있는 칸만 남긴다
    const entries = Object.entries(found).filter(([, code]) => code !== undefined);
    if (entries.length > 0) errors.absences[absence.id] = Object.fromEntries(entries);
  }

  if (input.completedCredits.trim() === "") {
    errors.completedCredits = "CREDITS_REQUIRED";
  } else if (parseCompletedTenths(input.completedCredits) === null) {
    errors.completedCredits = "CREDITS_INVALID";
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return (
    errors.grade !== undefined ||
    errors.absenceChoice !== undefined ||
    errors.completedCredits !== undefined ||
    Object.keys(errors.absences).length > 0
  );
}
