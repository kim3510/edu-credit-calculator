// 학점은 내부적으로 "0.1학점 = 1"인 정수(tenths)로 계산한다. 화면에 보일 때만 소수로 바꾼다.

// 28 → "2.8", 40 → "4", 0 → "0" (PRD 예시처럼 정수는 소수점 없이 쓴다)
export function formatTenths(tenths: number): string {
  const whole = Math.trunc(tenths / 10);
  const fraction = Math.abs(tenths % 10);
  return fraction === 0 ? String(whole) : `${whole}.${fraction}`;
}
