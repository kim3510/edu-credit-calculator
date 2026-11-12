// Design Ref: §5.5, §6 — 화면에 보이는 문구는 PRD 5장 원문과 "글자 그대로" 같아야 한다.
// 상수 값이 바뀌거나 오타가 나면 이 테스트가 바로 알려 준다.
import { describe, expect, it } from "vitest";
import { calculateCredits } from "./calculate";
import { addDays } from "./date";
import {
  TEXT_ACHIEVED,
  TEXT_DISCLAIMER,
  TEXT_NO_OBLIGATION,
  TEXT_RULES_BASIS,
} from "./constants";
import { buildConclusion, buildCopyText, buildTargetNote } from "./explain";
import { ERROR_MESSAGES } from "./validate";
import { absence } from "./test-helpers";

describe("PRD 5장 원문 문구", () => {
  it("면책 문구", () => {
    expect(TEXT_DISCLAIMER).toBe(
      "입력한 정보를 기준으로 한 결과이며 참고용으로만 활용하고, 정확한 값은 교육담당자를 통해 확인해 주세요",
    );
  });

  it("이수 의무 없음 / 달성 완료", () => {
    expect(TEXT_NO_OBLIGATION).toBe("선택한 연도에는 이수 의무가 없습니다");
    expect(TEXT_ACHIEVED).toBe("달성 완료");
  });

  it("복직일 오류 문구", () => {
    expect(ERROR_MESSAGES.RETURN_NOT_AFTER_START).toBe("복직일은 시작일보다 뒤여야 합니다");
  });

  it("그 밖의 오류 문구 (DESIGN 6장)", () => {
    expect(ERROR_MESSAGES).toEqual({
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
    });
  });
});

describe("목표 학점 설명 문장", () => {
  function note(grade: "3급" | "4급", absences: ReturnType<typeof absence>[], year = 2025) {
    return buildTargetNote(calculateCredits({ year, grade, absences, completedTenths: 0 }));
  }

  it("부재가 있으면 기준학점에서 인정 학점을 뺀 값이라고 설명한다 (검증 사례)", () => {
    expect(note("3급", [absence("2025-03-24", "2025-12-01")])).toBe(
      "목표 학점은 3급의 연간 기준학점 4학점에서 부재 기간에 해당하는 학점 2.8학점을 뺀, 이번 계산 연도에 이수해야 할 학점입니다. 남은 학점은 목표 학점에서 이수한 학점을 뺀 값입니다.",
    );
  });

  it("부재가 없으면 기준학점이 그대로 목표라고 설명한다", () => {
    expect(note("4급", [], 2026)).toBe(
      "4급의 연간 기준학점 5학점이 그대로 이번 계산 연도의 목표 학점입니다. (부재 기간이 있으면 그만큼을 뺀 학점이 목표가 됩니다.)",
    );
  });

  it("입력한 부재가 모두 계산 연도 밖이어도 '부재가 없는' 설명을 쓴다", () => {
    expect(note("4급", [absence("2024-01-01", "2024-03-01")], 2026)).toContain("그대로 이번 계산 연도의 목표 학점입니다");
  });

  // 5일짜리 부재를 하루씩 띄워 넣으면 건마다 0.1학점으로 올림되어 연중 내내 부재가 아니어도 합계가 쌓인다
  function shortAbsences(count: number) {
    return Array.from({ length: count }, (_, i) => {
      const start = addDays("2025-12-01", i * 6) as string;
      return absence(start, addDays(start, 5) as string);
    });
  }

  it("인정 학점이 기준학점 이상이면 이수할 학점이 없다고 설명한다 (4.1 > 4 / 4.0 = 4)", () => {
    expect(note("3급", shortAbsences(41), 2026)).toBe(
      "부재 기간에 해당하는 학점(4.1학점)이 3급의 기준학점 4학점 이상이어서, 이번 계산 연도에 이수해야 할 학점이 없습니다. (목표 학점 0)",
    );
    expect(note("3급", shortAbsences(40), 2026)).toBe(
      "부재 기간에 해당하는 학점(4학점)이 3급의 기준학점 4학점 이상이어서, 이번 계산 연도에 이수해야 할 학점이 없습니다. (목표 학점 0)",
    );
  });

  it("연중 내내 부재이면 이수할 학점이 없다고 설명한다", () => {
    expect(note("4급", [absence("2025-12-01", "2026-12-01")], 2026)).toBe(
      "계산 연도 전체가 부재 기간이어서, 4급의 기준학점 5학점 중 이번 계산 연도에 이수해야 할 학점이 없습니다. (목표 학점 0)",
    );
  });
});

describe("결과 맨 위의 결론 한 줄", () => {
  function conclusionOf(grade: "3급" | "4급", absences: ReturnType<typeof absence>[], completedTenths: number, year = 2025) {
    return buildConclusion(calculateCredits({ year, grade, absences, completedTenths }));
  }

  it("더 이수해야 하면 0.5 단위로 올림한 학점을 알려준다 (검증 사례: 목표 1.2 → 1.5학점 이상)", () => {
    expect(conclusionOf("3급", [absence("2025-03-24", "2025-12-01")], 0)).toEqual({
      tone: "todo",
      text: "앞으로 1.5학점 이상 더 이수해야 합니다",
    });
  });

  it("남은 학점이 0.5의 배수이면 그대로 알려준다 (부재 없는 4급 기준 5, 이수 2.5 → 2.5학점)", () => {
    expect(conclusionOf("4급", [], 25, 2026)).toEqual({
      tone: "todo",
      text: "앞으로 2.5학점 이상 더 이수해야 합니다",
    });
  });

  it("목표를 채웠으면 PRD 문구 '달성 완료'", () => {
    expect(conclusionOf("3급", [absence("2025-03-24", "2025-12-01")], 20)).toEqual({
      tone: "done",
      text: "달성 완료",
    });
  });

  it("이수 의무가 없으면 PRD 문구 (이수 학점이 0이어도 '이수 의무 없음'이 우선)", () => {
    expect(conclusionOf("4급", [absence("2025-12-01", "2026-12-01")], 0, 2026)).toEqual({
      tone: "none",
      text: "선택한 연도에는 이수 의무가 없습니다",
    });
  });
});

describe("계산 규정 안내의 근거 문구", () => {
  it("기준일과 규정 이름", () => {
    expect(TEXT_RULES_BASIS).toBe("이 안내는 2026.11.12 기준 [인력개발세칙]을 준용합니다");
  });
});

describe("결과 복사 글", () => {
  const withReason = { ...absence("2025-03-24", "2025-12-01"), reason: "파견" as const };
  const result = calculateCredits({ year: 2025, grade: "3급", absences: [withReason], completedTenths: 0 });
  const text = buildCopyText(result);

  it("목표·남은·들어야 할 학점과 계산 근거, 면책 문구가 들어간다", () => {
    expect(text).toContain("[교육학점 계산 결과] 2025년 (2024-12-01 ~ 2025-11-30) · 3급");
    expect(text).toContain("- 목표 학점: 1.2학점");
    expect(text).toContain("- 남은 학점: 1.2학점");
    expect(text).toContain("- 들어야 할 교육 학점: 1.5학점 이상");
    expect(text).toContain("- 인정 학점 4학점 × 252일/365일 = 2.8학점 → 목표 학점 4 − 2.8 = 1.2학점");
    expect(text).toContain(`※ ${TEXT_DISCLAIMER}.`);
  });

  it("겹쳐서 합친 부재가 있으면 그 사실도 복사 글에 들어간다 (D-11)", () => {
    const merged = calculateCredits({
      year: 2026,
      grade: "3급",
      absences: [absence("2026-03-01", "2026-06-01"), absence("2026-05-01", "2026-08-01")],
      completedTenths: 0,
    });
    expect(buildCopyText(merged)).toContain(
      "- 2026-03-01 ~ 2026-07-31 (153일) — 겹치는 부재 2건을 하나로 합쳐 겹친 날은 한 번만 계산",
    );
  });

  it("부재 사유는 복사 글에 넣지 않는다 (민감 정보일 수 있음)", () => {
    expect(text).not.toContain("파견");
  });

  it("이수 의무가 없는 경우와 달성 완료인 경우의 안내가 들어간다", () => {
    const none = calculateCredits({
      year: 2026,
      grade: "4급",
      absences: [absence("2025-12-01", "2026-12-01")],
      completedTenths: 0,
    });
    expect(buildCopyText(none)).toContain(`- ${TEXT_NO_OBLIGATION}`);
    const done = calculateCredits({ year: 2026, grade: "4급", absences: [], completedTenths: 60 });
    expect(buildCopyText(done)).toContain(`- ${TEXT_ACHIEVED}`);
  });
});
