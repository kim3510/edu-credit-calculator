// Design Ref: §6, §8.2 #12~#13 — 입력 검사 사례
import { describe, expect, it } from "vitest";
import { runCalculation } from "./index";
import type { CalculatorInput } from "./types";
import { parseCompletedTenths, validateInput } from "./validate";
import { absence, newHire } from "./test-helpers";

function input(partial: Partial<CalculatorInput> = {}): CalculatorInput {
  return { year: 2026, grade: "4급", absences: [], noAbsence: false, completedCredits: "0", ...partial };
}

describe("입력 검사", () => {
  it("모두 올바르면 오류가 없다", () => {
    const errors = validateInput(input({ absences: [absence("2026-03-01", "2026-04-01")] }));
    expect(errors).toEqual({ absences: {} });
  });

  it("직급을 고르지 않으면 GRADE_REQUIRED", () => {
    expect(validateInput(input({ grade: "" })).grade).toBe("GRADE_REQUIRED");
  });

  it("#12 복직일이 시작일과 같거나 앞이면 RETURN_NOT_AFTER_START", () => {
    for (const ret of ["2026-03-01", "2026-02-28"]) {
      const a = absence("2026-03-01", ret);
      const errors = validateInput(input({ absences: [a] }));
      expect(errors.absences[a.id].range).toBe("RETURN_NOT_AFTER_START");
    }
  });

  it("날짜가 비면 DATE_REQUIRED, 사유가 비면 REASON_REQUIRED", () => {
    const a = { ...absence("", ""), reason: "" as const };
    const errors = validateInput(input({ absences: [a] }));
    expect(errors.absences[a.id]).toEqual({
      reason: "REASON_REQUIRED",
      startDate: "DATE_REQUIRED",
      returnDate: "DATE_REQUIRED",
    });
  });

  it("신규채용은 입사일만 검사한다 (시작일·복직일은 검사하지 않음)", () => {
    const ok = newHire("2026-07-01");
    expect(validateInput(input({ absences: [ok] })).absences[ok.id]).toBeUndefined();
    const missing = newHire("");
    expect(validateInput(input({ absences: [missing] })).absences[missing.id]).toEqual({
      hireDate: "HIRE_DATE_REQUIRED",
    });
  });

  it("신규채용은 한 줄만 허용한다 — 두 번째부터 NEW_HIRE_DUPLICATE", () => {
    const first = newHire("2026-07-01");
    const second = newHire("2026-09-01");
    const errors = validateInput(input({ absences: [first, second] }));
    expect(errors.absences[first.id]).toBeUndefined();
    expect(errors.absences[second.id].reason).toBe("NEW_HIRE_DUPLICATE");
  });

  it("없는 날짜는 DATE_INVALID (시작일·복직일·입사일 모두)", () => {
    const start = absence("2026-02-30", "2026-04-01");
    expect(validateInput(input({ absences: [start] })).absences[start.id].startDate).toBe("DATE_INVALID");
    const back = absence("2026-03-01", "2026-13-01");
    expect(validateInput(input({ absences: [back] })).absences[back.id].returnDate).toBe("DATE_INVALID");
    const hire = newHire("2026-04-31");
    expect(validateInput(input({ absences: [hire] })).absences[hire.id].hireDate).toBe("DATE_INVALID");
  });

  it("#13 이수 학점: 비움 → REQUIRED, 1.3·-1·abc → INVALID, 0·1.5 → 통과", () => {
    expect(validateInput(input({ completedCredits: "" })).completedCredits).toBe("CREDITS_REQUIRED");
    expect(validateInput(input({ completedCredits: "  " })).completedCredits).toBe("CREDITS_REQUIRED");
    for (const bad of ["1.3", "-1", "abc", "1.25", "0.7"]) {
      expect(validateInput(input({ completedCredits: bad })).completedCredits).toBe("CREDITS_INVALID");
    }
    for (const good of ["0", "1.5", "2", "0.5", "10", "1.50", ".5", "2.00", " 1.5 "]) {
      expect(validateInput(input({ completedCredits: good })).completedCredits).toBeUndefined();
    }
    // 쉼표·전각 숫자·글자가 섞인 것, 0.5 단위가 아닌 것은 계속 막는다
    for (const bad of ["1,5", "１", "1.5학점", "1.", ".", "0.55", "1.75"]) {
      expect(validateInput(input({ completedCredits: bad })).completedCredits).toBe("CREDITS_INVALID");
    }
  });

  it("이수 학점 글자를 × 10 정수로 바꾼다", () => {
    expect(parseCompletedTenths("1.5")).toBe(15);
    expect(parseCompletedTenths("3")).toBe(30);
    expect(parseCompletedTenths("1.50")).toBe(15);
    expect(parseCompletedTenths(".5")).toBe(5);
    expect(parseCompletedTenths("1.3")).toBeNull();
  });
});

describe("부재 기간 없음 체크", () => {
  it("체크도 하지 않고 부재 줄도 없으면 ABSENCE_CHOICE_REQUIRED", () => {
    const errors = validateInput(input({ absences: [], noAbsence: false }));
    expect(errors.absenceChoice).toBe("ABSENCE_CHOICE_REQUIRED");
  });

  it("체크하면 부재 줄이 없어도 오류가 없다", () => {
    expect(validateInput(input({ absences: [], noAbsence: true }))).toEqual({ absences: {} });
  });

  it("부재 줄이 하나라도 있으면 체크하지 않아도 된다", () => {
    const errors = validateInput(input({ absences: [absence("2026-03-01", "2026-04-01")] }));
    expect(errors.absenceChoice).toBeUndefined();
  });

  it("체크하면 남아 있는 부재 줄은 검사하지도 계산하지도 않는다", () => {
    const broken = absence("", ""); // 날짜가 비어 있어도 오류가 되지 않음
    const outcome = runCalculation(input({ grade: "3급", absences: [broken], noAbsence: true }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.periods).toHaveLength(0);
      expect(outcome.result.targetTenths).toBe(40); // 부재 없음 → 목표 = 기준학점
    }
  });

  it("부재 기간 없는 사람: 이수 학점만 넣으면 더 들어야 할 학점이 나온다 (4급 기준 5학점, 이수 2.5 → 2.5)", () => {
    const outcome = runCalculation(input({ grade: "4급", noAbsence: true, completedCredits: "2.5" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.targetTenths).toBe(50);
      expect(outcome.result.remainingTenths).toBe(25);
      expect(outcome.result.requiredTenths).toBe(25);
      expect(outcome.result.explanation[0]).toBe("부재 기간이 없어 목표 학점은 기준학점 5학점입니다");
    }
  });
});

describe("runCalculation (검사 → 계산)", () => {
  it("오류가 있으면 계산하지 않는다", () => {
    const outcome = runCalculation(input({ grade: "" }));
    expect(outcome.ok).toBe(false);
  });

  it("검증 사례를 화면 입력과 같은 방식(복직일 2025-12-01)으로 넣으면 목표 1.2", () => {
    const outcome = runCalculation({
      year: 2025,
      grade: "3급",
      absences: [absence("2025-03-24", "2025-12-01")],
      noAbsence: false,
      completedCredits: "0",
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.targetTenths).toBe(12);
      expect(outcome.result.requiredTenths).toBe(15);
    }
  });
});
