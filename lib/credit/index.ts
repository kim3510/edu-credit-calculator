// Design Ref: §9 — 화면은 이 파일에서 내보내는 것만 쓴다. (lib/credit은 React·화면 코드를 가져다 쓰지 않는다)
import { calculateCredits } from "./calculate";
import type { CalculationResult, CalculatorInput, ValidationErrors } from "./types";
import { hasErrors, parseCompletedTenths, validateInput } from "./validate";
import type { Grade } from "./constants";

export * from "./constants";
export * from "./types";
export { ERROR_MESSAGES } from "./validate";
export { buildConclusion, buildCopyText, buildTargetNote } from "./explain";
export { formatTenths } from "./format";
export { defaultEvaluationYear, evaluationPeriod } from "./date";
export { calculateCredits } from "./calculate";
export { checkPeriodFit, findOverlappingIds, type PeriodFit } from "./periods";

export type RunOutcome =
  | { ok: true; result: CalculationResult }
  | { ok: false; errors: ValidationErrors };

// 입력 검사 → 통과하면 계산. 화면의 "계산하기" 버튼이 부르는 함수
export function runCalculation(input: CalculatorInput): RunOutcome {
  const errors = validateInput(input);
  if (hasErrors(errors)) return { ok: false, errors };

  // 검사를 통과했으므로 직급과 이수 학점은 올바른 값이다
  const completedTenths = parseCompletedTenths(input.completedCredits) as number;
  const result = calculateCredits({
    year: input.year,
    grade: input.grade as Grade,
    absences: input.noAbsence ? [] : input.absences, // "부재 기간 없음"이면 남아 있는 줄이 있어도 쓰지 않는다
    completedTenths,
  });
  return { ok: true, result };
}
