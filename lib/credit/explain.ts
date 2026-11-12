// Design Ref: §5.5 — 계산 근거 문장과 복사용 글 (문구는 PRD 5장 원문 기준)
import {
  CREDIT_STEP_TENTHS,
  TEXT_ACHIEVED,
  TEXT_DISCLAIMER,
  TEXT_NO_OBLIGATION,
} from "./constants";
import { addDays } from "./date";
import { formatTenths } from "./format";
import type { CalculationResult } from "./types";

type ExplainSource = Omit<CalculationResult, "explanation">;

// 계산 근거를 한 줄씩 만든다
export function buildExplanation(r: ExplainSource): string[] {
  const lines: string[] = [];

  // 신규채용은 입사일을 먼저 밝힌다 (입사일 전날까지가 부재 기간으로 계산되기 때문)
  if (r.newHireDate) {
    const hire = r.newHireDate;
    if (hire <= r.periodStart) {
      lines.push(`입사일 ${hire}: 계산 연도 시작일 이전(또는 같음)이라 신규채용으로 인한 부재는 없습니다`);
    } else if (hire > r.periodEnd) {
      lines.push(`입사일 ${hire}: 계산 연도 종료일 이후라 선택한 연도 전체를 부재로 계산합니다`);
    } else {
      lines.push(`입사일 ${hire} → ${r.periodStart} ~ ${addDays(hire, -1)} 부재로 계산`);
    }
  }

  // 실제로 반영한 부재 기간 (계산 연도를 넘으면 "~만 반영")
  // 신규채용 입사일이 계산 연도 끝보다 뒤면 1년 전체가 부재로 계산된다. 이 기간은 사용자가 잘린 기간을
  // 입력한 것이 아니므로 "만 반영"을 붙이지 않는다 (바로 위 입사일 문장이 이유를 설명한다).
  const hireCoversYear = r.newHireDate !== null && r.newHireDate > r.periodEnd;
  for (const p of r.periods) {
    const wholeYearByHire = hireCoversYear && p.from === r.periodStart && p.to === r.periodEnd;
    const range =
      p.clipped && !wholeYearByHire
        ? `${p.from} ~ ${p.to}만 반영 (${p.days}일)`
        : `${p.from} ~ ${p.to} (${p.days}일)`;
    // 서로 겹치는 부재는 겹친 날을 한 번만 세어 하나로 합친다 — 그 사실을 결과에 밝힌다
    lines.push(
      p.mergedCount > 1
        ? `${range} — 겹치는 부재 ${p.mergedCount}건을 하나로 합쳐 겹친 날은 한 번만 계산`
        : range,
    );
  }
  for (const o of r.outsidePeriods) {
    lines.push(`${o.from} ~ ${o.to}: 선택한 연도와 겹치지 않아 계산에 반영하지 않았습니다`);
  }

  // 목표 학점 계산식
  const base = r.baseCredits;
  const recognized = formatTenths(r.recognizedTenths);
  if (r.periods.length === 0) {
    // 부재를 입력했지만 모두 계산 연도 밖이거나 입사일이 시작일 이전이면 "반영할" 부재가 없다고 말한다
    const none =
      r.outsidePeriods.length === 0 && !r.newHireDate ? "부재 기간이 없어" : "반영할 부재 기간이 없어";
    lines.push(`${none} 목표 학점은 기준학점 ${base}학점입니다`);
  } else if (r.fullYearAbsent) {
    lines.push("선택한 연도 전체가 부재 기간이므로 목표 학점은 0학점입니다");
  } else {
    const credits =
      r.periods.length === 1
        ? `인정 학점 ${base}학점 × ${r.periods[0].days}일/${r.daysInYear}일 = ${recognized}학점`
        : `건별 인정 학점 ${r.periods.map((p) => formatTenths(p.creditTenths)).join(" + ")} = ${recognized}학점`;
    const target =
      r.recognizedTenths > base * 10
        ? `목표 학점 ${base} − ${recognized} → 0학점 (0보다 작으면 0으로 처리)`
        : `목표 학점 ${base} − ${recognized} = ${formatTenths(r.targetTenths)}학점`;
    lines.push(`${credits} → ${target}`);
  }

  // 남은 학점 계산식 (이수 의무가 없으면 따로 계산할 것이 없다)
  if (r.targetTenths > 0) {
    const target = formatTenths(r.targetTenths);
    const completed = formatTenths(r.completedTenths);
    if (r.remainingTenths === 0) {
      lines.push(`남은 학점 ${target} − ${completed} → 0학점 (${TEXT_ACHIEVED})`);
    } else {
      lines.push(
        `남은 학점 ${target} − ${completed} = ${formatTenths(r.remainingTenths)}학점 → ${formatTenths(r.requiredTenths)}학점 이상 이수 필요`,
      );
    }
  }
  return lines;
}

// 결과 맨 위에 보여줄 "결론 한 줄". 직원이 가장 궁금한 "그래서 앞으로 몇 학점을 더 들어야 하나"를 먼저 알려준다.
// - todo: 아직 더 이수해야 함 → "앞으로 1.5학점 이상 더 이수해야 합니다"
// - done: 이미 목표를 채움 → PRD 문구 "달성 완료"
// - none: 이수 의무가 없음 → PRD 문구 "선택한 연도에는 이수 의무가 없습니다"
export interface Conclusion {
  tone: "todo" | "done" | "none";
  text: string;
}

export function buildConclusion(r: Pick<CalculationResult, "status" | "requiredTenths">): Conclusion {
  if (r.status === "no-obligation") return { tone: "none", text: TEXT_NO_OBLIGATION };
  if (r.status === "achieved") return { tone: "done", text: TEXT_ACHIEVED };
  return { tone: "todo", text: `앞으로 ${formatTenths(r.requiredTenths)}학점 이상 더 이수해야 합니다` };
}

// "목표 학점"이 무엇인지 설명하는 문장 (결과 숫자 카드 아래에 보여준다)
// 목표 학점 = 직급별 기준학점에서 부재 기간에 해당하는 학점을 뺀, 그 계산 연도에 이수해야 할 학점
type TargetNoteSource = Pick<
  CalculationResult,
  "grade" | "baseCredits" | "recognizedTenths" | "periods" | "fullYearAbsent"
>;

export function buildTargetNote(r: TargetNoteSource): string {
  const base = r.baseCredits;
  if (r.periods.length === 0) {
    return `${r.grade}의 연간 기준학점 ${base}학점이 그대로 이번 계산 연도의 목표 학점입니다. (부재 기간이 있으면 그만큼을 뺀 학점이 목표가 됩니다.)`;
  }
  if (r.fullYearAbsent) {
    return `계산 연도 전체가 부재 기간이어서, ${r.grade}의 기준학점 ${base}학점 중 이번 계산 연도에 이수해야 할 학점이 없습니다. (목표 학점 0)`;
  }
  const recognized = formatTenths(r.recognizedTenths);
  if (r.recognizedTenths >= base * 10) {
    return `부재 기간에 해당하는 학점(${recognized}학점)이 ${r.grade}의 기준학점 ${base}학점 이상이어서, 이번 계산 연도에 이수해야 할 학점이 없습니다. (목표 학점 0)`;
  }
  return `목표 학점은 ${r.grade}의 연간 기준학점 ${base}학점에서 부재 기간에 해당하는 학점 ${recognized}학점을 뺀, 이번 계산 연도에 이수해야 할 학점입니다. 남은 학점은 목표 학점에서 이수한 학점을 뺀 값입니다.`;
}

// 결과 복사 버튼용 글 (메신저에 붙여넣기 쉬운 형태). 부재 사유는 넣지 않는다.
export function buildCopyText(r: CalculationResult): string {
  const lines = [
    `[교육학점 계산 결과] ${r.year}년 (${r.periodStart} ~ ${r.periodEnd}) · ${r.grade}`,
    `- 목표 학점: ${formatTenths(r.targetTenths)}학점`,
    `- 남은 학점: ${formatTenths(r.remainingTenths)}학점`,
  ];
  if (r.status === "no-obligation") {
    lines.push(`- ${TEXT_NO_OBLIGATION}`);
  } else if (r.status === "achieved") {
    lines.push(`- ${TEXT_ACHIEVED}`);
  } else {
    lines.push(`- 들어야 할 교육 학점: ${formatTenths(r.requiredTenths)}학점 이상`);
  }
  lines.push("", "계산 근거", ...r.explanation.map((line) => `- ${line}`), "", `※ ${TEXT_DISCLAIMER}.`);
  return lines.join("\n");
}

// 0.5 단위로 올림 (남은 학점 × 10 → 들어야 할 학점 × 10). 예: 13 → 15
export function ceilToStep(tenths: number): number {
  return Math.ceil(tenths / CREDIT_STEP_TENTHS) * CREDIT_STEP_TENTHS;
}
