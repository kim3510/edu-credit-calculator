// Design Ref: §2.2 ②~④ — 부재 한 건을 날짜 범위로 바꾸고, 계산 연도 안으로 자르고, 겹치면 합친다.
// 범위는 모두 "날짜 번호(dateToDayNumber)"로 다루며 양 끝 날짜를 포함한다.
import { NEW_HIRE_REASON, type AbsenceReason } from "./constants";
import { dateToDayNumber, dayNumberToDate, evaluationPeriod } from "./date";
import type { AbsenceInput } from "./types";

export interface RawPeriod {
  from: number;
  to: number;
  reason: AbsenceReason | "";
}

export interface ClippedPeriod {
  from: number;
  to: number;
  clipped: boolean; // 계산 연도 밖이 잘려 나갔는지
  reasons: AbsenceReason[];
  count: number; // 이 기간으로 합쳐진 입력 줄 수 (1이면 겹쳐서 합쳐진 것이 없음)
}

// 입력 한 줄 → 부재 범위. 부재일은 시작일부터 복직일 "전날"까지다.
// 신규채용은 계산 연도 시작일부터 입사일 전날까지를 부재로 본다.
// 날짜가 비었거나 범위가 성립하지 않으면(입사일이 시작일 이전 등) null
export function toRawPeriod(absence: AbsenceInput, yearStartDay: number): RawPeriod | null {
  if (absence.reason === NEW_HIRE_REASON) {
    const hireDay = dateToDayNumber(absence.hireDate);
    if (hireDay === null) return null;
    const to = hireDay - 1;
    return to < yearStartDay ? null : { from: yearStartDay, to, reason: absence.reason };
  }

  const startDay = dateToDayNumber(absence.startDate);
  const returnDay = dateToDayNumber(absence.returnDate);
  if (startDay === null || returnDay === null || returnDay <= startDay) return null;
  return { from: startDay, to: returnDay - 1, reason: absence.reason };
}

// 계산 연도(startDay ~ endDay) 안으로 자른다. 통째로 밖이면 null
export function clipToPeriod(
  raw: RawPeriod,
  startDay: number,
  endDay: number,
): ClippedPeriod | null {
  const from = Math.max(raw.from, startDay);
  const to = Math.min(raw.to, endDay);
  if (from > to) return null;
  return {
    from,
    to,
    clipped: from !== raw.from || to !== raw.to,
    reasons: raw.reason === "" ? [] : [raw.reason],
    count: 1,
  };
}

// 입력한 부재 기간이 계산 연도에 얼마나 해당하는지 (입력 칸 아래 안내용)
// - unknown: 날짜가 덜 입력됐거나 신규채용이라 판단하지 않음
// - inside: 계산 연도 안에 모두 들어옴
// - partial: 일부만 걸침 → from ~ to만 반영됨
// - outside: 통째로 계산 연도 밖 → 계산에 반영되지 않음
// - hireBeforeYear: 신규채용 입사일이 계산 연도 시작일과 같거나 그 이전 → 신규채용으로 인한 부재 없음
// - hireAfterYear: 신규채용 입사일이 계산 연도 종료일 이후 → 1년 전체가 부재로 계산됨
export type PeriodFit =
  | { kind: "unknown" }
  | { kind: "inside" }
  | { kind: "partial"; from: string; to: string }
  | { kind: "outside" }
  | { kind: "hireBeforeYear" }
  | { kind: "hireAfterYear" };

export function checkPeriodFit(absence: AbsenceInput, year: number): PeriodFit {
  const { start, end } = evaluationPeriod(year);
  const startDay = dateToDayNumber(start) as number;
  const endDay = dateToDayNumber(end) as number;

  if (absence.reason === NEW_HIRE_REASON) {
    const hireDay = dateToDayNumber(absence.hireDate);
    if (hireDay === null) return { kind: "unknown" };
    if (hireDay <= startDay) return { kind: "hireBeforeYear" };
    if (hireDay > endDay) return { kind: "hireAfterYear" };
    return { kind: "inside" };
  }

  const raw = toRawPeriod(absence, startDay);
  if (!raw) return { kind: "unknown" };
  const inside = clipToPeriod(raw, startDay, endDay);
  if (!inside) return { kind: "outside" };
  return inside.clipped
    ? { kind: "partial", from: dayNumberToDate(inside.from), to: dayNumberToDate(inside.to) }
    : { kind: "inside" };
}

// 계산 연도 안에서 다른 부재와 하루라도 겹치는 줄의 id 모음 (입력 줄 아래 안내용)
// 겹치지 않고 이어지기만 한 줄(앞 줄 종료일 + 1 = 다음 줄 시작일)은 겹침으로 보지 않는다.
export function findOverlappingIds(absences: AbsenceInput[], year: number): Set<string> {
  const { start, end } = evaluationPeriod(year);
  const startDay = dateToDayNumber(start) as number;
  const endDay = dateToDayNumber(end) as number;

  const ranges: { id: string; from: number; to: number }[] = [];
  for (const absence of absences) {
    const raw = toRawPeriod(absence, startDay);
    const inside = raw && clipToPeriod(raw, startDay, endDay);
    if (inside) ranges.push({ id: absence.id, from: inside.from, to: inside.to });
  }

  const ids = new Set<string>();
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i].from <= ranges[j].to && ranges[j].from <= ranges[i].to) {
        ids.add(ranges[i].id);
        ids.add(ranges[j].id);
      }
    }
  }
  return ids;
}

// 하루라도 겹치는 건끼리만 하나로 합친다 (겹친 날은 한 번만 센다).
// 겹치지 않고 이어지기만 한 건(앞 건 종료일 + 1 = 다음 건 시작일)은 따로 둔다 — 건별로 반올림해야 하므로.
export function mergeOverlapping(periods: ClippedPeriod[]): ClippedPeriod[] {
  const sorted = [...periods].sort((a, b) => a.from - b.from || a.to - b.to);
  const merged: ClippedPeriod[] = [];

  for (const period of sorted) {
    const last = merged[merged.length - 1];
    if (last && period.from <= last.to) {
      last.to = Math.max(last.to, period.to);
      last.clipped = last.clipped || period.clipped;
      last.count += period.count;
      for (const reason of period.reasons) {
        if (!last.reasons.includes(reason)) last.reasons.push(reason);
      }
    } else {
      merged.push({ ...period, reasons: [...period.reasons] });
    }
  }
  return merged;
}
