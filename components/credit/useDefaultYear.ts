"use client";

import { useSyncExternalStore } from "react";
import { defaultEvaluationYear } from "@/lib/credit";

// 오늘 날짜로 정한 기본 계산 연도 (12월 1일 이후면 내년, 아니면 올해).
// Next.js가 화면을 미리 그리는 동안에는 현재 시간을 읽을 수 없으므로(오류가 남),
// 서버에서는 null을 돌려주고 브라우저에서 화면이 뜬 뒤에 실제 값으로 바뀐다.
function subscribe(onChange: () => void): () => void {
  // 화면을 연 채로 날짜가 바뀌어도(예: 11/30 → 12/1) 기본 연도가 따라가도록 1분마다 다시 확인한다.
  // 값이 같으면 React가 화면을 다시 그리지 않는다.
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

function getSnapshot(): number {
  const now = new Date();
  return defaultEvaluationYear({ year: now.getFullYear(), month: now.getMonth() + 1 });
}

function getServerSnapshot(): null {
  return null;
}

export function useDefaultYear(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
