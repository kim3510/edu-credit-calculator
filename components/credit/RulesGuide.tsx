import { TEXT_RULES_BASIS } from "@/lib/credit";
import { cardClass, ruleItemClass, summaryClass, summaryIconClass } from "./Field";

const RULES = [
  "목표 학점: 직급별 기준학점에서 부재 기간(휴직·파견 등)에 해당하는 학점을 뺀, 해당 계산 연도에 이수해야 할 학점입니다. 부재 기간이 없으면 기준학점이 그대로 목표 학점입니다.",
  "직급별 기준학점: 3급 4학점, 4급 5학점, 5급 6학점, 6급 6학점. 직급은 계산 연도 평가 종료일(11월 30일) 기준입니다.",
  "계산 연도는 전년 12월 1일부터 해당 연도 11월 30일까지입니다. (예: 2025년 = 2024-12-01 ~ 2025-11-30)",
  "부재일은 시작일부터 복직일 전날까지입니다. 1년 일수는 365일이고, 평가 기간 안에 2월 29일이 있으면 366일입니다.",
  "부재 건마다 인정 학점 = 부재 일수 ÷ 1년 일수 × 기준학점 (소수 둘째 자리에서 반올림)을 구해 더하고, 목표 학점 = 기준학점 − 인정 학점 합계입니다.",
  "부재 기간이 겹친 날은 한 번만 계산하고, 계산 연도 밖의 날은 제외합니다.",
  "연중 내내 부재하면 목표 학점은 0학점입니다.",
  "남은 학점은 0.5학점 단위로 올림하여 안내합니다.",
];

// 계산 규정 안내 (접이식). PRD 5장의 계산 규칙만 요약한다.
// 내규 원문의 "1개월 미만 절사"는 현재 운영 방식에 맞춰 적용하지 않으므로 싣지 않는다.
export default function RulesGuide() {
  return (
    <details className={`${cardClass} group`}>
      <summary className={summaryClass}>
        계산 규정 안내
        <span aria-hidden="true" className={summaryIconClass}>
          ›
        </span>
      </summary>
      <p className="mt-3 text-sm font-medium text-fg">{TEXT_RULES_BASIS}.</p>
      <ul className="mt-3 space-y-2 text-sm text-fg">
        {RULES.map((rule) => (
          <li key={rule} className={ruleItemClass}>
            {rule}
          </li>
        ))}
      </ul>
    </details>
  );
}
