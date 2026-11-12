import { describe, expect, it } from "vitest";
import {
  addDays,
  dateToDayNumber,
  dayNumberToDate,
  daysInEvaluationYear,
  defaultEvaluationYear,
  evaluationPeriod,
  isLeapYear,
} from "./date";

describe("날짜 도우미", () => {
  it("날짜 글자와 날짜 번호를 서로 바꿔도 같은 날짜가 나온다", () => {
    for (const text of ["2025-03-24", "2024-02-29", "2026-12-31", "2000-01-01"]) {
      expect(dayNumberToDate(dateToDayNumber(text) as number)).toBe(text);
    }
  });

  it("없는 날짜나 잘못된 형식은 null이다", () => {
    expect(dateToDayNumber("2025-02-30")).toBeNull();
    expect(dateToDayNumber("2025-13-01")).toBeNull();
    expect(dateToDayNumber("2025-3-4")).toBeNull();
    expect(dateToDayNumber("")).toBeNull();
    expect(dateToDayNumber("0050-01-01")).toBeNull();
    expect(dateToDayNumber("20255-01-01")).toBeNull();
  });

  it("하루를 더하고 뺀다 (월·연도 경계 포함)", () => {
    expect(addDays("2025-11-30", 1)).toBe("2025-12-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
  });
});

describe("계산 연도(학점평가 연도)", () => {
  it("N년은 (N-1)년 12월 1일 ~ N년 11월 30일이다", () => {
    expect(evaluationPeriod(2025)).toEqual({ start: "2024-12-01", end: "2025-11-30" });
  });

  it("윤년 판단", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it("1년 일수: 평가 기간에 2월 29일이 있을 때만 366일", () => {
    expect(daysInEvaluationYear(2025)).toBe(365); // 달력 2024년이 윤년이어도 365
    expect(daysInEvaluationYear(2024)).toBe(366); // 2023-12-01 ~ 2024-11-30에 2024-02-29 포함
    expect(daysInEvaluationYear(2028)).toBe(366);
    expect(daysInEvaluationYear(2026)).toBe(365);
  });

  it("평가 기간의 실제 일수가 1년 일수와 같다", () => {
    for (const year of [2024, 2025, 2026, 2028]) {
      const { start, end } = evaluationPeriod(year);
      const days = (dateToDayNumber(end) as number) - (dateToDayNumber(start) as number) + 1;
      expect(days).toBe(daysInEvaluationYear(year));
    }
  });

  it("기본 연도: 12월 1일 이후에는 내년, 그 전에는 올해", () => {
    expect(defaultEvaluationYear({ year: 2026, month: 11 })).toBe(2026);
    expect(defaultEvaluationYear({ year: 2026, month: 12 })).toBe(2027);
    expect(defaultEvaluationYear({ year: 2026, month: 1 })).toBe(2026);
  });
});
