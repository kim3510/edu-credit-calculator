// Design Ref: §8.2 — 계산 테스트 사례 (PRD 검증 사례 + 경계 사례 + 담당자 엑셀 실제 사례)
// 학점은 "× 10 한 정수"로 비교한다 (예: 2.8 → 28).
import { describe, expect, it } from "vitest";
import { calculateCredits } from "./calculate";
import { addDays } from "./date";
import { checkPeriodFit, findOverlappingIds } from "./periods";
import type { Grade } from "./constants";
import type { AbsenceInput } from "./types";
import { absence, absenceEndingOn, newHire } from "./test-helpers";

function run(year: number, grade: Grade, absences: AbsenceInput[], completedTenths = 0) {
  return calculateCredits({ year, grade, absences, completedTenths });
}

describe("PRD 검증 사례", () => {
  it("3급, 2025-03-24 ~ 종료 2025-11-30 → 252일, 인정 2.8, 목표 1.2", () => {
    const r = run(2025, "3급", [absence("2025-03-24", "2025-12-01")]);
    expect(r.periods).toHaveLength(1);
    expect(r.periods[0].days).toBe(252);
    expect(r.recognizedTenths).toBe(28);
    expect(r.targetTenths).toBe(12);
    expect(r.explanation).toContain(
      "인정 학점 4학점 × 252일/365일 = 2.8학점 → 목표 학점 4 − 2.8 = 1.2학점",
    );
  });
});

describe("DESIGN 8.2 계산 사례", () => {
  it("#2 부재 없음 → 목표 = 기준학점", () => {
    const r = run(2026, "4급", []);
    expect(r.targetTenths).toBe(50);
    expect(r.explanation[0]).toBe("부재 기간이 없어 목표 학점은 기준학점 5학점입니다");
  });

  it("#3 윤년 판별: 5급, 2028년, 64일 → 366일로 나눠 인정 1.0, 목표 5.0", () => {
    const r = run(2028, "5급", [absence("2028-01-01", "2028-03-05")]);
    expect(r.daysInYear).toBe(366);
    expect(r.periods[0].days).toBe(64);
    expect(r.recognizedTenths).toBe(10);
    expect(r.targetTenths).toBe(50);
  });

  it("#3-1 윤년 일반: 182일 → 인정 3.0, 목표 3.0", () => {
    const r = run(2028, "5급", [absence("2028-01-01", "2028-07-01")]);
    expect(r.periods[0].days).toBe(182);
    expect(r.recognizedTenths).toBe(30);
    expect(r.targetTenths).toBe(30);
  });

  it("#3-2 달력이 윤년이어도 평가 기간에 2/29가 없으면 365일: 인정 1.1, 목표 4.9", () => {
    const r = run(2025, "5급", [absence("2024-12-01", "2025-02-03")]);
    expect(r.daysInYear).toBe(365);
    expect(r.periods[0].days).toBe(64);
    expect(r.recognizedTenths).toBe(11);
    expect(r.targetTenths).toBe(49);
  });

  it("#4 연도 걸침: 시작 쪽이 잘려 2025-12-01 ~ 2026-03-14만 반영 (104일)", () => {
    const r = run(2026, "3급", [absence("2025-10-01", "2026-03-15")]);
    expect(r.periods[0]).toMatchObject({
      from: "2025-12-01",
      to: "2026-03-14",
      days: 104,
      clipped: true,
      creditTenths: 11,
    });
    expect(r.targetTenths).toBe(29);
    expect(r.explanation[0]).toBe("2025-12-01 ~ 2026-03-14만 반영 (104일)");
  });

  it("#4-1 통째로 계산 연도 밖 → 반영 없음, 목표 4.0", () => {
    const r = run(2026, "3급", [absence("2024-01-01", "2024-03-01")]);
    expect(r.periods).toHaveLength(0);
    expect(r.outsidePeriods).toEqual([{ from: "2024-01-01", to: "2024-02-29" }]);
    expect(r.targetTenths).toBe(40);
    // 부재를 입력했지만 반영할 것이 없을 때는 "반영할 부재 기간이 없어"라고 말한다
    expect(r.explanation).toContain("반영할 부재 기간이 없어 목표 학점은 기준학점 4학점입니다");
    expect(r.explanation).toContain(
      "2024-01-01 ~ 2024-02-29: 선택한 연도와 겹치지 않아 계산에 반영하지 않았습니다",
    );
  });

  it("#4-2 연도 끝 경계: 2026-11-15 ~ 11-30만 반영 (16일), 인정 0.2", () => {
    const r = run(2026, "3급", [absence("2026-11-15", "2027-01-10")]);
    expect(r.periods[0]).toMatchObject({ from: "2026-11-15", to: "2026-11-30", days: 16, clipped: true });
    expect(r.recognizedTenths).toBe(2);
    expect(r.targetTenths).toBe(38);
  });

  it("#5 겹친 두 건은 한 건으로 합쳐 (153일) 인정 1.7, 목표 2.3", () => {
    const r = run(2026, "3급", [absence("2026-03-01", "2026-06-01"), absence("2026-05-01", "2026-08-01")]);
    expect(r.periods).toHaveLength(1);
    expect(r.periods[0]).toMatchObject({ from: "2026-03-01", to: "2026-07-31", days: 153 });
    expect(r.recognizedTenths).toBe(17);
    expect(r.targetTenths).toBe(23);
    // 겹쳐서 합쳤다는 사실이 결과에 남는다
    expect(r.periods[0].mergedCount).toBe(2);
    expect(r.explanation[0]).toBe(
      "2026-03-01 ~ 2026-07-31 (153일) — 겹치는 부재 2건을 하나로 합쳐 겹친 날은 한 번만 계산",
    );
  });

  it("#5-1 같은 기간을 두 번 입력해도 한 번만 계산하고, 합쳤다는 사실을 남긴다", () => {
    const r = run(2025, "3급", [absence("2025-03-24", "2025-12-01"), absence("2025-03-24", "2025-12-01")]);
    expect(r.periods).toHaveLength(1);
    expect(r.periods[0].mergedCount).toBe(2);
    expect(r.targetTenths).toBe(12); // 검증 사례와 같은 결과
  });

  it("#5-2 겹치지 않은 부재는 합쳐진 표시가 없다", () => {
    const r = run(2026, "3급", [absence("2026-03-01", "2026-04-01"), absence("2026-04-01", "2026-05-01")]);
    expect(r.periods.map((p) => p.mergedCount)).toEqual([1, 1]);
    expect(r.explanation.join("\n")).not.toContain("겹치는 부재");
  });

  it("#5-3 세 건이 이어서 겹치면 한 건으로 합치고 3건이라고 남긴다", () => {
    const r = run(2026, "3급", [
      absence("2026-03-01", "2026-04-01"),
      absence("2026-03-20", "2026-05-01"),
      absence("2026-04-20", "2026-06-01"),
    ]);
    expect(r.periods).toHaveLength(1);
    expect(r.periods[0]).toMatchObject({ from: "2026-03-01", to: "2026-05-31", mergedCount: 3 });
  });

  it("#6 이어지기만 한 두 건은 따로 반올림 (0.3 + 0.3), 목표 3.4", () => {
    const r = run(2026, "3급", [absence("2026-03-01", "2026-04-01"), absence("2026-04-01", "2026-05-01")]);
    expect(r.periods.map((p) => p.days)).toEqual([31, 30]);
    expect(r.periods.map((p) => p.creditTenths)).toEqual([3, 3]);
    expect(r.recognizedTenths).toBe(6);
    expect(r.targetTenths).toBe(34);
    // 여러 건일 때의 근거 문장 (글자 그대로)
    expect(r.explanation).toContain(
      "건별 인정 학점 0.3 + 0.3 = 0.6학점 → 목표 학점 4 − 0.6 = 3.4학점",
    );
  });

  it("#7 신규채용: 입사일 2026-07-01 → 2025-12-01 ~ 2026-06-30 (212일), 인정 3.5, 목표 2.5", () => {
    const r = run(2026, "6급", [newHire("2026-07-01")]);
    expect(r.periods[0]).toMatchObject({ from: "2025-12-01", to: "2026-06-30", days: 212 });
    expect(r.recognizedTenths).toBe(35);
    expect(r.targetTenths).toBe(25);
  });

  it("#7-1 신규채용 근거 문장에 입사일이 먼저 나온다", () => {
    const r = run(2026, "6급", [newHire("2026-07-01")]);
    expect(r.newHireDate).toBe("2026-07-01");
    expect(r.explanation[0]).toBe("입사일 2026-07-01 → 2025-12-01 ~ 2026-06-30 부재로 계산");
    // 입사일이 계산 연도 시작 전이면 부재가 없다고, 종료 후면 전체를 부재로 본다고 밝힌다
    expect(run(2026, "3급", [newHire("2025-06-01")]).explanation[0]).toBe(
      "입사일 2025-06-01: 계산 연도 시작일 이전(또는 같음)이라 신규채용으로 인한 부재는 없습니다",
    );
    expect(run(2026, "3급", [newHire("2027-03-01")]).explanation[0]).toBe(
      "입사일 2027-03-01: 계산 연도 종료일 이후라 선택한 연도 전체를 부재로 계산합니다",
    );
    expect(run(2026, "3급", [absence("2026-03-01", "2026-04-01")]).newHireDate).toBeNull();
  });

  it("#7-2 입사일이 계산 연도 끝보다 뒤면 1년 전체 기간에 '만 반영'을 붙이지 않는다 (직접 입력한 긴 부재는 붙임)", () => {
    const byHire = run(2025, "3급", [newHire("2026-03-01")]);
    expect(byHire.explanation[0]).toBe(
      "입사일 2026-03-01: 계산 연도 종료일 이후라 선택한 연도 전체를 부재로 계산합니다",
    );
    expect(byHire.explanation[1]).toBe("2024-12-01 ~ 2025-11-30 (365일)");
    // 사용자가 연도보다 긴 부재를 직접 입력한 경우는 잘렸다는 사실을 그대로 알린다
    const byLeave = run(2025, "3급", [absence("2020-01-01", "2030-01-01")]);
    expect(byLeave.explanation[0]).toBe("2024-12-01 ~ 2025-11-30만 반영 (365일)");
  });

  it("#8 신규채용 입사일이 계산 연도 시작일 이전/같음 → 부재 0일, 목표 4.0", () => {
    for (const hire of ["2025-06-01", "2025-12-01"]) {
      const r = run(2026, "3급", [newHire(hire)]);
      expect(r.periods).toHaveLength(0);
      expect(r.targetTenths).toBe(40);
    }
  });

  it("#8-1 신규채용 입사일이 계산 연도 종료 다음 날 이후 → 1년 전체 부재, 목표 0", () => {
    for (const hire of ["2026-12-01", "2027-03-01"]) {
      const r = run(2026, "3급", [newHire(hire)]);
      expect(r.coveredDays).toBe(365);
      expect(r.targetTenths).toBe(0);
      expect(r.status).toBe("no-obligation");
    }
  });

  it("#9 연중 내내 한 건 부재 → 인정 5.0, 목표 0, 이수 의무 없음", () => {
    const r = run(2026, "4급", [absence("2025-12-01", "2026-12-01")]);
    expect(r.coveredDays).toBe(365);
    expect(r.recognizedTenths).toBe(50);
    expect(r.targetTenths).toBe(0);
    expect(r.status).toBe("no-obligation");
    expect(r.explanation).toContain("선택한 연도 전체가 부재 기간이므로 목표 학점은 0학점입니다");
  });

  it("#9-1 연중 내내 이어진 세 건(67·3·295일): 건별 인정 합계는 3.9지만 목표는 0 (D-7)", () => {
    const r = run(2026, "3급", [
      absence("2025-12-01", "2026-02-06"),
      absence("2026-02-06", "2026-02-09"),
      absence("2026-02-09", "2026-12-01"),
    ]);
    expect(r.periods.map((p) => p.days)).toEqual([67, 3, 295]);
    expect(r.recognizedTenths).toBe(39);
    expect(r.fullYearAbsent).toBe(true);
    expect(r.targetTenths).toBe(0);
    expect(r.status).toBe("no-obligation");
  });

  it("#9-1b 윤년 평가 연도(2028)에 366일 내내 부재 → 366일 기준으로 판정해 목표 0", () => {
    const r = run(2028, "5급", [absence("2027-12-01", "2028-12-01")]);
    expect(r.daysInYear).toBe(366);
    expect(r.coveredDays).toBe(366);
    expect(r.fullYearAbsent).toBe(true);
    expect(r.targetTenths).toBe(0);
  });

  // D-2: 연중 내내 부재는 아니지만 건별 반올림 때문에 인정 합계가 기준학점 이상이 되는 경우
  // 5일짜리 부재를 하루씩 띄워 여러 번 넣으면 건마다 0.548 → 0.1로 올림되어 합계가 부풀려진다
  function shortAbsences(count: number) {
    const list: AbsenceInput[] = [];
    for (let i = 0; i < count; i++) {
      const start = addDays("2025-12-01", i * 6) as string;
      list.push(absence(start, addDays(start, 5) as string)); // 5일 (복직일 = 시작일 + 5)
    }
    return list;
  }

  it("#9-1c 인정 합계가 기준학점과 같으면(40건 × 0.1 = 4.0) 목표 0, '0보다 작으면' 문구는 붙지 않는다", () => {
    const r = run(2026, "3급", shortAbsences(40));
    expect(r.fullYearAbsent).toBe(false); // 부재 일수는 200일뿐
    expect(r.recognizedTenths).toBe(40);
    expect(r.targetTenths).toBe(0);
    expect(r.status).toBe("no-obligation");
    expect(r.explanation.join("\n")).toContain("→ 목표 학점 4 − 4 = 0학점");
    expect(r.explanation.join("\n")).not.toContain("0보다 작으면");
  });

  it("#9-1d 인정 합계가 기준학점을 넘으면(41건 = 4.1) 0 미만은 0으로 처리한다고 밝힌다", () => {
    const r = run(2026, "3급", shortAbsences(41));
    expect(r.recognizedTenths).toBe(41);
    expect(r.targetTenths).toBe(0);
    expect(r.explanation.join("\n")).toContain("목표 학점 4 − 4.1 → 0학점 (0보다 작으면 0으로 처리)");
  });

  it("#9-2 1개월 미만 부재도 절사 없이 하루씩 인정 (10일 → 0.1)", () => {
    const r = run(2026, "3급", [absence("2026-03-01", "2026-03-11")]);
    expect(r.periods[0].days).toBe(10);
    expect(r.recognizedTenths).toBe(1);
    expect(r.targetTenths).toBe(39);
  });

  it("#10 남은 학점은 0.5 단위로 올림한다 (1.2 → 1.5, 1.3 → 1.5, 1.5 → 1.5)", () => {
    const r = run(2025, "3급", [absence("2025-03-24", "2025-12-01")]); // 목표 1.2
    expect(r.remainingTenths).toBe(12);
    expect(r.requiredTenths).toBe(15);
    expect(run(2025, "3급", [absence("2025-03-24", "2025-12-01")], 0).explanation.at(-1)).toBe(
      "남은 학점 1.2 − 0 = 1.2학점 → 1.5학점 이상 이수 필요",
    );
    // 남은 1.5 → 1.5 그대로, 남은 0.5 → 0.5 그대로
    expect(run(2026, "6급", [], 45).requiredTenths).toBe(15);
    expect(run(2026, "6급", [], 55).requiredTenths).toBe(5);
    // 남은 1.3 → 1.5 (남은 학점이 실제로 1.3이 되는 경우: 4급 기준 5.0, 이수 3.7은 화면에서는 막히지만 함수는 올림만 본다)
    const thirteen = run(2026, "4급", [], 37);
    expect(thirteen.remainingTenths).toBe(13);
    expect(thirteen.requiredTenths).toBe(15);
  });

  it("#11 이수 학점이 목표 이상이면 남은 0, 달성 완료", () => {
    const r = run(2025, "3급", [absence("2025-03-24", "2025-12-01")], 20);
    expect(r.remainingTenths).toBe(0);
    expect(r.requiredTenths).toBe(0);
    expect(r.status).toBe("achieved");
    expect(r.explanation.at(-1)).toBe("남은 학점 1.2 − 2 → 0학점 (달성 완료)");
  });

  it("목표 0이면 이수 학점이 0이어도 '이수 의무 없음'이 우선이다", () => {
    const r = run(2026, "4급", [absence("2025-12-01", "2026-12-01")], 0);
    expect(r.status).toBe("no-obligation");
  });

  it("사유는 계산에 영향이 없다 (사유만 다른 두 입력의 결과가 같다)", () => {
    const a = { ...absence("2026-03-01", "2026-06-01"), reason: "파견" as const };
    const b = { ...a, reason: "교육파견" as const };
    expect(run(2026, "4급", [a]).targetTenths).toBe(run(2026, "4급", [b]).targetTenths);
  });
});

describe("부재 기간이 계산 연도에 해당하는지 (입력 칸 안내)", () => {
  // 계산 연도 2025년 = 2024-12-01 ~ 2025-11-30
  it("통째로 밖이면 outside (앞쪽·뒤쪽 모두)", () => {
    expect(checkPeriodFit(absence("2024-01-01", "2024-03-01"), 2025)).toEqual({ kind: "outside" });
    expect(checkPeriodFit(absence("2024-11-01", "2024-12-01"), 2025)).toEqual({ kind: "outside" }); // 종료일 11-30
    expect(checkPeriodFit(absence("2025-12-01", "2026-02-01"), 2025)).toEqual({ kind: "outside" }); // 시작일이 12-01
  });

  it("일부만 걸치면 partial이고 반영되는 기간을 알려 준다", () => {
    expect(checkPeriodFit(absence("2024-11-01", "2024-12-02"), 2025)).toEqual({
      kind: "partial",
      from: "2024-12-01",
      to: "2024-12-01",
    });
    expect(checkPeriodFit(absence("2025-11-15", "2026-01-10"), 2025)).toEqual({
      kind: "partial",
      from: "2025-11-15",
      to: "2025-11-30",
    });
  });

  it("모두 안에 있으면 inside", () => {
    expect(checkPeriodFit(absence("2025-03-24", "2025-12-01"), 2025)).toEqual({ kind: "inside" });
    expect(checkPeriodFit(absence("2024-12-01", "2025-12-01"), 2025)).toEqual({ kind: "inside" });
  });

  it("날짜가 덜 입력됐으면 unknown", () => {
    expect(checkPeriodFit(absence("2025-03-24", ""), 2025)).toEqual({ kind: "unknown" });
    expect(checkPeriodFit(newHire(""), 2025)).toEqual({ kind: "unknown" });
  });

  it("신규채용: 입사일이 계산 연도 안이면 inside, 시작일 이전·같음이면 hireBeforeYear, 종료일 이후면 hireAfterYear", () => {
    expect(checkPeriodFit(newHire("2025-07-01"), 2025)).toEqual({ kind: "inside" });
    expect(checkPeriodFit(newHire("2025-11-30"), 2025)).toEqual({ kind: "inside" });
    expect(checkPeriodFit(newHire("2024-12-02"), 2025)).toEqual({ kind: "inside" });
    expect(checkPeriodFit(newHire("2024-12-01"), 2025)).toEqual({ kind: "hireBeforeYear" });
    expect(checkPeriodFit(newHire("2024-06-01"), 2025)).toEqual({ kind: "hireBeforeYear" });
    expect(checkPeriodFit(newHire("2025-12-01"), 2025)).toEqual({ kind: "hireAfterYear" });
    expect(checkPeriodFit(newHire("2027-03-01"), 2025)).toEqual({ kind: "hireAfterYear" });
  });
});

describe("다른 부재와 겹치는 줄 찾기 (입력 칸 안내)", () => {
  it("하루라도 겹치는 두 줄의 id를 모두 돌려준다 (같은 기간 중복 포함)", () => {
    const a = absence("2026-03-01", "2026-06-01");
    const b = absence("2026-05-01", "2026-08-01");
    const c = absence("2026-03-01", "2026-06-01");
    expect(findOverlappingIds([a, b], 2026)).toEqual(new Set([a.id, b.id]));
    expect(findOverlappingIds([a, c], 2026)).toEqual(new Set([a.id, c.id]));
  });

  it("이어지기만 한 줄(앞 복직일 = 다음 시작일)이나 떨어진 줄은 겹침이 아니다", () => {
    const a = absence("2026-03-01", "2026-04-01");
    const b = absence("2026-04-01", "2026-05-01");
    const c = absence("2026-09-01", "2026-10-01");
    expect(findOverlappingIds([a, b, c], 2026).size).toBe(0);
  });

  it("계산 연도 밖의 줄과 겹치는 것은 세지 않는다", () => {
    const a = absence("2026-03-01", "2026-06-01");
    const outside = absence("2024-03-01", "2024-06-01");
    expect(findOverlappingIds([a, outside], 2026).size).toBe(0);
  });

  it("신규채용 기간과 다른 부재가 겹치면 둘 다 겹침이다", () => {
    const hire = newHire("2026-07-01"); // 2025-12-01 ~ 2026-06-30
    const leave = absence("2026-01-01", "2026-02-01");
    expect(findOverlappingIds([hire, leave], 2026)).toEqual(new Set([hire.id, leave.id]));
  });
});

// 담당자 엑셀 표(사진)에서 옮긴 실제 사례. 계산 연도 2025년 = 2024-12-01 ~ 2025-11-30.
// 직급·날짜·결과만 넣는다 (부재 사유·이름·사번은 넣지 않는다).
describe("담당자 엑셀 실제 사례 (2025년)", () => {
  type Case = {
    no: string;
    grade: Grade;
    absences: [start: string, end: string][];
    creditTenths: number[]; // 건별 인정 학점 × 10
    targetTenths: number;
  };
  const cases: Case[] = [
    { no: "1", grade: "3급", absences: [["2025-03-24", "2025-11-30"]], creditTenths: [28], targetTenths: 12 },
    { no: "2", grade: "4급", absences: [["2025-03-14", "2025-11-30"]], creditTenths: [36], targetTenths: 14 },
    { no: "3", grade: "4급", absences: [["2024-12-01", "2025-02-28"]], creditTenths: [12], targetTenths: 38 },
    {
      no: "4+5",
      grade: "4급",
      absences: [["2024-12-01", "2025-04-09"], ["2025-04-10", "2025-11-30"]],
      creditTenths: [18, 32],
      targetTenths: 0,
    },
    {
      no: "6+7",
      grade: "4급",
      absences: [["2024-12-01", "2025-01-31"], ["2025-02-01", "2025-02-09"]],
      creditTenths: [8, 1],
      targetTenths: 41,
    },
    {
      no: "8+9",
      grade: "4급",
      absences: [["2024-12-01", "2025-07-14"], ["2025-07-15", "2025-11-30"]],
      creditTenths: [31, 19],
      targetTenths: 0,
    },
    { no: "10", grade: "5급", absences: [["2025-10-12", "2025-11-30"]], creditTenths: [8], targetTenths: 52 },
    {
      no: "11+12",
      grade: "4급",
      absences: [["2024-12-01", "2025-02-18"], ["2025-02-19", "2025-11-30"]],
      creditTenths: [11, 39],
      targetTenths: 0,
    },
  ];

  it.each(cases)("연번 $no 은 엑셀 결과와 같다", ({ grade, absences, creditTenths, targetTenths }) => {
    const r = run(2025, grade, absences.map(([s, e]) => absenceEndingOn(s, e)));
    expect(r.periods.map((p) => p.creditTenths)).toEqual(creditTenths);
    expect(r.targetTenths).toBe(targetTenths);
  });
});
