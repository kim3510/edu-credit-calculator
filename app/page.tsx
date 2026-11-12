import Image from "next/image";
import CreditCalculator from "@/components/credit/CreditCalculator";

// Design Ref: §5.3 — 페이지 뼈대(제목·설명)만 서버에서 그리고, 계산은 브라우저 컴포넌트가 한다.
// 디자인 방향: KRDS(대한민국 정부 디자인 시스템) 토큰 + 캠코 CI 색(블루 #091F5F, 레드 #FF0050)을 포인트로 쓴다.
// ① 맨 위 가는 안내띠 ② 흰 머리글 띠(캠코 로고·제목·마스코트 키우미) ③ 연회색 본문 ④ 맨 아래 출처 표시.
// 로고·마스코트는 캠코 누리집(kamco.or.kr)에서 받은 이미지이며, 캠코 담당자와 사용 협의를 마쳤다는 사용자 확인에 따라 쓴다 (D-28).
// 비공식 계산기임을 맨 아래에 밝혀 캠코 공식 서비스로 오해되지 않게 한다.
// 폭(D-24): 큰 화면에서는 최대 1152px(max-w-6xl)까지 넓혀 입력·결과를 두 칸으로 놓는다. 휴대폰은 한 칸.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 안내띠: 입력값을 저장하지 않는다는 것을 가장 먼저 알린다 */}
      <div className="border-b border-line-light bg-surface-secondary">
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-fg-subtle">
          <span className="mr-2 inline-block rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-bold text-fg-inverse">
            개인정보 보호
          </span>
          입력한 내용은 이 화면 안에서만 계산되며, 저장하거나 서버로 보내지 않습니다.
        </p>
      </div>

      {/* 머리글 띠: 아래 가는 줄은 캠코 CI의 레드 */}
      <header className="border-b-4 border-[#ff0050] bg-surface">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 pt-5 sm:pt-6">
          <div className="pb-6 sm:pb-8">
            <Image
              src="/kamco/kamco-logo.png"
              alt="캠코 한국자산관리공사"
              width={233}
              height={60}
              priority
              className="h-10 w-auto sm:h-12"
            />
            {/* KRDS heading-large(32px)·Bold, 모바일은 heading-medium(24px). 제목 색은 캠코 CI 블루 */}
            <h1 className="mt-5 text-2xl font-bold text-[#091f5f] sm:text-3xl">내 교육학점 계산기</h1>
            {/* 한 문장으로 간단히: 폭 제한이 없어 PC에서는 한 줄에 들어간다 */}
            <p className="mt-3 text-lg text-fg-subtle">
              직급과 부재 기간을 입력하면 목표 학점, 남은 학점, 계산 근거를 확인할 수 있습니다.
            </p>
          </div>
          {/* 마스코트 키우미: 장식 이미지라 읽어 줄 필요가 없다(alt 비움) */}
          <Image
            src="/kamco/kiuumi.png"
            alt=""
            width={899}
            height={1183}
            priority
            sizes="160px"
            className="h-28 w-auto shrink-0 sm:h-40"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <CreditCalculator />
      </main>

      {/* 출처·비공식 표기 */}
      <footer className="border-t border-line-light bg-surface">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm leading-6 text-fg-subtle">
          이 계산기는 직원이 참고용으로 만든 비공식 도구이며, 한국자산관리공사(캠코)의 공식 서비스가 아닙니다.
          <br />
          캠코 로고·마스코트 키우미의 저작권은 한국자산관리공사에 있습니다 (출처: 캠코 누리집 kamco.or.kr).
        </p>
      </footer>
    </div>
  );
}
