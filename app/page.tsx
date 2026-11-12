import CreditCalculator from "@/components/credit/CreditCalculator";

// Design Ref: §5.3 — 페이지 뼈대(제목·설명)만 서버에서 그리고, 계산은 브라우저 컴포넌트가 한다.
// 디자인 방향: KRDS(대한민국 정부 디자인 시스템) 토큰을 따른다. ① 맨 위 가는 안내띠 ② 흰 머리글 띠 ③ 연회색(gray-5) 본문.
// 사내 서비스이므로 KRDS의 "공식 전자정부 누리집" 표시(masthead)·정부 상징은 쓰지 않는다.
// 폭(D-24): 큰 화면에서는 최대 1152px(max-w-6xl)까지 넓혀 입력·결과를 두 칸으로 놓는다. 휴대폰은 한 칸.
export default function Home() {
  return (
    <div className="flex-1">
      {/* 안내띠: 사내 전용·저장 안 함을 가장 먼저 알린다 */}
      <div className="border-b border-line-light bg-surface-secondary">
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-fg-subtle">
          <span className="mr-2 inline-block rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-bold text-fg-inverse">
            사내 전용
          </span>
          입력한 내용은 이 화면 안에서만 계산되며, 저장하거나 서버로 보내지 않습니다.
        </p>
      </div>

      <header className="border-b border-line-light bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          {/* KRDS heading-large(32px)·Bold, 모바일은 heading-medium(24px) */}
          <h1 className="text-2xl font-bold text-fg-bolder sm:text-3xl">내 교육학점 계산기</h1>
          {/* 한 문장으로 간단히: 폭 제한이 없어 PC에서는 한 줄에 들어간다 */}
          <p className="mt-3 text-lg text-fg-subtle">
            직급과 부재 기간을 입력하면 목표 학점, 남은 학점, 계산 근거를 확인할 수 있습니다.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <CreditCalculator />
      </main>
    </div>
  );
}
