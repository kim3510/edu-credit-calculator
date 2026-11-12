// Design Ref: §3.1 — 직급별 기준학점과 부재 사유를 한곳에 모은 기준값 (내규가 바뀌면 이 파일만 고친다)

// 직급별 연간 이수 기준학점. 1·2급은 이수 대상이 아니므로 넣지 않는다.
export const GRADE_BASE_CREDITS = {
  "3급": 4,
  "4급": 5,
  "5급": 6,
  "6급": 6,
} as const;

export type Grade = keyof typeof GRADE_BASE_CREDITS;

// 선택칸에 보여줄 직급 목록 (위 표의 순서 그대로)
export const GRADES = Object.keys(GRADE_BASE_CREDITS) as Grade[];

// 부재 사유 10가지. 기록용일 뿐이며 어떤 사유를 골라도 계산 방식은 같다.
export const ABSENCE_REASONS = [
  "파견",
  "교육파견",
  "국외근무",
  "부점장",
  "노동조합",
  "신규채용",
  "징집",
  "휴직",
  "인병휴가",
  "출산전후휴가",
] as const;

export type AbsenceReason = (typeof ABSENCE_REASONS)[number];

// 신규채용은 입사일 하나만 입력받는 특별한 사유다.
export const NEW_HIRE_REASON: AbsenceReason = "신규채용";

// 교육 학점은 0.5학점 단위로 부여된다. 내부 계산은 0.1학점을 1로 보는 정수를 쓰므로 5가 0.5학점이다.
export const CREDIT_STEP_TENTHS = 5;

// 화면에 쓰는 문구 (PRD 5장 원문 그대로 — 테스트에서도 이 문자열을 그대로 비교한다)
export const TEXT_NO_OBLIGATION = "선택한 연도에는 이수 의무가 없습니다";
export const TEXT_ACHIEVED = "달성 완료";
// 계산 규정 안내가 따르는 규정과 기준일 (규정이 바뀌면 이 문구의 날짜와 이름을 함께 고친다)
export const TEXT_RULES_BASIS = "이 안내는 2026.11.12 기준 [인력개발세칙]을 준용합니다";
export const TEXT_DISCLAIMER =
  "입력한 정보를 기준으로 한 결과이며 참고용으로만 활용하고, 정확한 값은 교육담당자를 통해 확인해 주세요";
