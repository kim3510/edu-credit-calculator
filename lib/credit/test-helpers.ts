// 테스트용 도우미 (화면 코드에서는 쓰지 않는다)
import { addDays } from "./date";
import type { AbsenceInput } from "./types";

let counter = 0;

// 복직일을 직접 넣는 부재 한 줄. (사유는 계산에 영향이 없으므로 모두 "파견"으로 통일한다.
// 건강이나 가정사와 관련될 수 있는 사유는 테스트 파일에 넣지 않는다 — 설계 7장)
export function absence(startDate: string, returnDate: string): AbsenceInput {
  counter += 1;
  return { id: `a${counter}`, reason: "파견", startDate, returnDate, hireDate: "" };
}

// 엑셀의 "학점계산종료일"(마지막 부재일)로 넣는 부재 한 줄. 복직일 = 종료일 다음 날
export function absenceEndingOn(startDate: string, endDate: string): AbsenceInput {
  return absence(startDate, addDays(endDate, 1) as string);
}

// 신규채용 한 줄 (입사일만 입력)
export function newHire(hireDate: string): AbsenceInput {
  counter += 1;
  return { id: `a${counter}`, reason: "신규채용", startDate: "", returnDate: "", hireDate };
}
