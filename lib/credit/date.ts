// Design Ref: §3.4 — 날짜는 "YYYY-MM-DD" 글자로 다루고, 일수는 UTC 기준 하루 단위로 센다.
// (시간대 때문에 한국 시간에서 날짜가 하루 밀리는 문제를 막기 위함)

const MS_PER_DAY = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM-DD" → 1970-01-01부터 센 날짜 번호. 형식이나 실제 날짜가 틀리면 null
export function dateToDayNumber(text: string): number | null {
  if (!DATE_PATTERN.test(text)) return null;
  const [year, month, day] = text.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const back = new Date(ms);
  // 2월 30일 같은 없는 날짜, 0000~0099년(JS가 1900년대로 바꿔 버림)을 걸러낸다
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.round(ms / MS_PER_DAY);
}

// 날짜 번호 → "YYYY-MM-DD"
export function dayNumberToDate(dayNumber: number): string {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

// 날짜 글자에 일수를 더한다 (음수면 뺀다). 잘못된 날짜면 null
export function addDays(text: string, days: number): string | null {
  const dayNumber = dateToDayNumber(text);
  return dayNumber === null ? null : dayNumberToDate(dayNumber + days);
}

// 윤년: 4로 나누어떨어지고 100으로는 안 나누어떨어지거나, 400으로 나누어떨어지면 윤년
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 계산 연도 N의 기간: (N-1)년 12월 1일 ~ N년 11월 30일 (학점평가 종료일이 11월 30일)
export function evaluationPeriod(year: number): { start: string; end: string } {
  return { start: `${year - 1}-12-01`, end: `${year}-11-30` };
}

// 1년 일수: 평가 기간 안에 2월 29일이 있으면 366일. 그 2월 29일은 N이 윤년일 때만 기간에 들어온다.
// (예: 2025년 = 2024-12-01 ~ 2025-11-30 → 365일. 달력 2024년이 윤년이어도 365일)
export function daysInEvaluationYear(year: number): 365 | 366 {
  return isLeapYear(year) ? 366 : 365;
}

// 입력 화면의 기본 계산 연도: 12월 1일부터는 새 평가 연도가 시작되므로 내년, 그 전에는 올해
export function defaultEvaluationYear(today: { year: number; month: number }): number {
  return today.month >= 12 ? today.year + 1 : today.year;
}
