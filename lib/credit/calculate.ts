// Design Ref: §2.2 ②~⑨, §3.4 — 목표·남은·들어야 할 학점 계산 (담당자 엑셀과 같은 방식)
// Plan SC: SC-1(검증 사례 일치), SC-2(실제 사례 일치) — 모든 학점은 "0.1학점 = 1"인 정수로 계산한다.
import { GRADE_BASE_CREDITS, NEW_HIRE_REASON, type Grade } from "./constants";
import {
  dateToDayNumber,
  dayNumberToDate,
  daysInEvaluationYear,
  evaluationPeriod,
} from "./date";
import { buildExplanation, ceilToStep } from "./explain";
import { clipToPeriod, mergeOverlapping, toRawPeriod, type ClippedPeriod } from "./periods";
import type {
  AbsenceInput,
  AppliedPeriod,
  CalculationResult,
  OutsidePeriod,
  ResultStatus,
} from "./types";

export interface CalculationParams {
  year: number;
  grade: Grade;
  absences: AbsenceInput[];
  completedTenths: number; // 이수 학점 × 10 (0.5 단위)
}

export function calculateCredits(params: CalculationParams): CalculationResult {
  const { year, grade, absences, completedTenths } = params;
  const baseCredits = GRADE_BASE_CREDITS[grade];
  const daysInYear = daysInEvaluationYear(year);
  const { start, end } = evaluationPeriod(year);
  const startDay = dateToDayNumber(start) as number; // 항상 올바른 날짜
  const endDay = dateToDayNumber(end) as number;

  // ②③ 부재 건마다 날짜 범위로 바꾸고 계산 연도 안으로 자른다. 통째로 밖이면 따로 모아 둔다.
  const clipped: ClippedPeriod[] = [];
  const outsidePeriods: OutsidePeriod[] = [];
  for (const absence of absences) {
    const raw = toRawPeriod(absence, startDay);
    if (!raw) continue;
    const inside = clipToPeriod(raw, startDay, endDay);
    if (inside) clipped.push(inside);
    else outsidePeriods.push({ from: dayNumberToDate(raw.from), to: dayNumberToDate(raw.to) });
  }

  // ④⑤ 겹친 건을 합친 뒤, 건마다 인정 학점을 소수 첫째 자리로 반올림한다 (엑셀 ROUND(…,1)).
  // 분자(일수 × 기준학점 × 10)가 정수라 ".5" 경계가 생기지 않아 Math.round 결과가 엑셀과 항상 같다.
  const periods: AppliedPeriod[] = mergeOverlapping(clipped).map((p) => {
    const days = p.to - p.from + 1;
    return {
      reasons: p.reasons,
      from: dayNumberToDate(p.from),
      to: dayNumberToDate(p.to),
      days,
      clipped: p.clipped,
      mergedCount: p.count,
      creditTenths: Math.round((days * baseCredits * 10) / daysInYear),
    };
  });

  const coveredDays = periods.reduce((sum, p) => sum + p.days, 0);
  const recognizedTenths = periods.reduce((sum, p) => sum + p.creditTenths, 0);

  // ⑥ 목표 학점 = 기준학점 − 인정 학점 합계 (0 미만이면 0).
  // 연중 내내 부재(합친 부재 일수 = 1년 일수)면 반올림 결과와 상관없이 0 (DESIGN 3.5 D-7)
  const fullYearAbsent = coveredDays >= daysInYear;
  const targetTenths = fullYearAbsent ? 0 : Math.max(0, baseCredits * 10 - recognizedTenths);

  // ⑦⑧ 남은 학점(0 미만이면 0)과, 0.5 단위로 올림한 "들어야 할 교육 학점"
  const remainingTenths = Math.max(0, targetTenths - completedTenths);
  const requiredTenths = ceilToStep(remainingTenths);

  const status: ResultStatus =
    targetTenths === 0 ? "no-obligation" : remainingTenths === 0 ? "achieved" : "in-progress";

  const result = {
    year,
    periodStart: start,
    periodEnd: end,
    grade,
    newHireDate:
      absences.find((a) => a.reason === NEW_HIRE_REASON && dateToDayNumber(a.hireDate) !== null)
        ?.hireDate ?? null,
    baseCredits,
    daysInYear,
    periods,
    outsidePeriods,
    coveredDays,
    fullYearAbsent,
    recognizedTenths,
    targetTenths,
    completedTenths,
    remainingTenths,
    requiredTenths,
    status,
  };
  // ⑨ 계산 근거 문장
  return { ...result, explanation: buildExplanation(result) };
}
