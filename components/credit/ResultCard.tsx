"use client";

import { useState } from "react";
import {
  buildConclusion,
  buildCopyText,
  buildTargetNote,
  formatTenths,
  TEXT_DISCLAIMER,
  type CalculationResult,
} from "@/lib/credit";
import {
  buttonClass,
  buttonTertiary,
  cardClass,
  noticeClass,
  ruleItemClass,
  summaryClass,
  summaryIconClass,
} from "./Field";

interface Props {
  result: CalculationResult;
  stale: boolean; // 결과를 낸 뒤 입력이 바뀌었는지
}

// 가장 중요한 숫자(큰 칸)의 색: 상태에 따라 KRDS 단색으로 바뀐다. 흰 글씨와의 대비가 4.5:1 이상인 색만 쓴다.
// todo: primary-50(#256ef4) · done: success-50(#228738) · none: gray-50(#6d7882)
const PRIMARY_STYLE = {
  todo: { box: "border-primary bg-primary text-fg-inverse", bar: "bg-primary" },
  done: { box: "border-success bg-success text-fg-inverse", bar: "bg-success" },
  none: { box: "border-gray-element bg-gray-element text-fg-inverse", bar: "bg-gray-element" },
} as const;

// 숫자 카드 하나. primary(가장 중요한 숫자)는 단색 큰 칸에 흰 큰 글씨로, 나머지는 흰 작은 칸으로 보여준다.
// 꾸밈은 단색 바탕과 얇은 테두리뿐이다 (배경 그림·그라데이션·투명 효과를 쓰지 않는다 — D-21).
function Figure({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: keyof typeof PRIMARY_STYLE; // 지정하면 큰 칸(가장 중요한 숫자)
}) {
  if (tone) {
    const style = PRIMARY_STYLE[tone];
    return (
      <div
        className={`rounded-xl border p-6 col-span-2 @lg:row-span-2 @lg:flex @lg:flex-col @lg:justify-center ${style.box}`}
      >
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-2 text-7xl font-bold leading-none tracking-tight">
          {value}
          <span className="ml-2 text-2xl font-bold">학점</span>
        </div>
        {note && <div className="mt-3 text-base font-medium">{note}</div>}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-line-light bg-surface p-4">
      <div className="text-sm text-fg-subtle">{label}</div>
      <div className="mt-1 text-3xl font-bold leading-none text-fg-bolder">
        {value}
        <span className="ml-1 text-base font-medium">학점</span>
      </div>
    </div>
  );
}

// 결론 한 줄의 모양: 종류별 KRDS 시스템 색과 아이콘 (색만으로 구분하지 않도록 아이콘 글자도 함께 쓴다)
const CONCLUSION_STYLE = {
  todo: { icon: "➜", box: "border-line-primary-light bg-surface-primary text-fg-primary" },
  done: { icon: "✅", box: "border-line-success-light bg-surface-success text-fg-success" },
  none: { icon: "ℹ", box: "border-line-light bg-surface-subtle text-fg-bolder" },
} as const;

// ④ 결과: 결론 한 줄, 목표·남은·들어야 할 학점, 계산 근거, 면책 문구
export default function ResultCard({ result, stale }: Props) {
  const [copyMessage, setCopyMessage] = useState("");

  async function handleCopy() {
    if (stale) return; // 입력이 바뀐 뒤의 이전 결과는 복사하지 않는다 (옛 값을 전달하는 것을 막기 위함)
    try {
      await navigator.clipboard.writeText(buildCopyText(result));
      setCopyMessage("복사했습니다");
    } catch {
      setCopyMessage("복사하지 못했습니다. 화면을 직접 선택해 복사해 주세요.");
    }
  }

  const needMore = result.status === "in-progress";
  const conclusion = buildConclusion(result);
  const conclusionStyle = CONCLUSION_STYLE[conclusion.tone];
  // 이수 진행률(%): 이수 학점 ÷ 목표 학점, 100%를 넘지 않게 자른다
  const progress =
    result.targetTenths > 0
      ? Math.min(100, Math.round((result.completedTenths / result.targetTenths) * 100))
      : null;
  const mergedPeriods = result.periods.filter((p) => p.mergedCount > 1); // 겹쳐서 합쳐진 부재

  return (
    <section
      aria-labelledby="result-title"
      className={`${cardClass} ${stale ? "opacity-60" : ""}`}
    >
      {/* tabIndex -1: 계산이 끝나면 키보드 초점을 이 제목으로 옮겨, 화면 읽기 프로그램이 결과가 나왔음을 읽게 한다 */}
      <h2
        id="result-title"
        tabIndex={-1}
        className="mb-1 text-2xl font-bold text-fg-bolder focus:outline-none"
      >
        계산 결과
      </h2>
      <p className="mb-4 text-sm text-fg-subtle">
        {result.year}년 ({result.periodStart} ~ {result.periodEnd}) · {result.grade}
      </p>

      {stale && (
        <p role="status" className={`mb-4 ${noticeClass.warning}`}>
          ⚠ 입력이 바뀌었습니다. 아래는 이전 결과이니 &quot;계산하기&quot;를 다시 눌러 주세요.
        </p>
      )}

      {/* 결론 한 줄: 가장 궁금한 "앞으로 몇 학점을 더 들어야 하는지"를 숫자 카드보다 먼저 보여준다 */}
      <p
        className={`mb-4 rounded-lg border p-4 text-lg font-bold leading-snug ${conclusionStyle.box}`}
      >
        <span aria-hidden="true" className="mr-2">
          {conclusionStyle.icon}
        </span>
        {conclusion.text}
      </p>

      {/* 가장 궁금한 "들어야 할 교육 학점"을 큰 칸으로, 목표·남은 학점은 옆의 작은 칸으로 보여준다 */}
      {/* @container: 화면이 아니라 이 칸 자체의 폭에 맞춰 배치한다 — 좁으면 큰 칸 아래에 작은 칸 2개, 넓으면 큰 칸 옆에 작은 칸 2개 */}
      <div className="@container">
        <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
          <Figure
            tone={conclusion.tone}
            label="들어야 할 교육 학점"
            value={formatTenths(result.requiredTenths)}
            note={needMore ? "이상 이수 필요" : undefined}
          />
          <Figure label="목표 학점" value={formatTenths(result.targetTenths)} />
          <Figure label="남은 학점" value={formatTenths(result.remainingTenths)} />
        </div>
      </div>

      {/* 이수 진행 막대: 목표 학점 대비 지금까지 이수한 학점 (목표가 0이면 보여주지 않는다) */}
      {progress !== null && (
        <div className="mt-3 rounded-xl border border-line-light bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="font-bold text-fg-bolder">이수 진행</span>
            <span className="text-fg-subtle">
              이수 {formatTenths(result.completedTenths)}학점 / 목표 {formatTenths(result.targetTenths)}학점 ({progress}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="목표 학점 대비 이수 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-3 w-full overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className={`h-full rounded-full ${PRIMARY_STYLE[conclusion.tone].bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 목표 학점이 무엇을 뜻하는지 (기준학점에서 부재 기간만큼 뺀 값) */}
      <p className="mt-3 text-sm text-fg-subtle">{buildTargetNote(result)}</p>

      {result.outsidePeriods.length > 0 && (
        <div role="status" className={`mt-4 ${noticeClass.warning}`}>
          <p className="font-medium">
            ⚠ 계산 연도({result.periodStart} ~ {result.periodEnd})에 해당하지 않아 계산에 반영하지
            않은 부재 기간이 있습니다.
          </p>
          <ul className="mt-1 list-disc pl-5">
            {result.outsidePeriods.map((o, i) => (
              <li key={i}>
                {o.from} ~ {o.to}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mergedPeriods.length > 0 && (
        <div role="status" className={`mt-4 ${noticeClass.information}`}>
          <p className="font-medium">
            ℹ 입력한 부재 기간 중 서로 겹치는 날이 있어, 겹친 날은 한 번만 계산했습니다.
          </p>
          <ul className="mt-1 list-disc pl-5">
            {mergedPeriods.map((p, i) => (
              <li key={i}>
                {p.from} ~ {p.to} ({p.days}일): 겹치는 부재 {p.mergedCount}건을 하나로 합쳐 계산
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 계산 근거는 처음에는 접어 두고, 눌러서 펼쳐 본다 (계산 규정 안내와 같은 방식) */}
      <details className="group mt-5 rounded-lg border border-line-light p-4">
        <summary className={summaryClass}>
          계산 근거
          <span aria-hidden="true" className={summaryIconClass}>
            ›
          </span>
        </summary>
        <ul className="mt-3 space-y-2 text-sm text-fg">
          {result.explanation.map((line, i) => (
            <li key={i} className={ruleItemClass}>
              {line}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={stale}
          className={`${buttonClass} ${buttonTertiary}`}
        >
          결과 복사
        </button>
        <span role="status" className="text-sm text-fg-subtle">
          {stale ? "입력이 바뀌어 복사할 수 없습니다. 다시 계산해 주세요." : copyMessage}
        </span>
      </div>

      {/* "꼭 확인하세요!" 안내 상자: 면책 문구(PRD 원문)를 눈에 띄는 회색 상자로 보여준다 */}
      <div className="mt-5 flex gap-3 rounded-lg border border-line-light bg-surface-subtle p-4 text-sm text-fg-subtle">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-inverse text-sm font-bold text-surface"
        >
          !
        </span>
        <div>
          <p className="font-bold text-fg-bolder">꼭 확인하세요!</p>
          <p>※ {TEXT_DISCLAIMER}.</p>
        </div>
      </div>
    </section>
  );
}
