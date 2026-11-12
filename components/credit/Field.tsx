import type { ReactNode } from "react";
import { ERROR_MESSAGES, type ErrorCode } from "@/lib/credit";

// 입력칸·카드·버튼의 공통 모양 (Tailwind 클래스) — KRDS 컴포넌트 규격을 따른다.
// 색 이름(surface·fg·line·primary 등)은 app/globals.css의 KRDS 토큰이다. 어두운 화면 색도 토큰이 알아서 바꾼다.

// KRDS 입력 필드 medium: 높이 48px · 모서리 6px · 글자 17px · 좌우 여백 16px · 테두리 gray-60,
// 입력 중에는 테두리 primary-50 2px, 오류면 danger-50
export const inputClass =
  "h-12 w-full rounded-md border border-line-dark bg-surface px-4 text-base text-fg focus:border-2 focus:border-primary focus:px-[15px] focus:outline-none aria-invalid:border-line-danger disabled:border-line disabled:bg-surface-muted disabled:text-fg-disabled";

// 카드: 흰 바탕 + gray-20 테두리 + 모서리 12px(xlarge). KRDS 카드 여백(small 20px / medium 24px)
export const cardClass = "rounded-2xl border border-line-light bg-surface p-5 sm:p-6";

// KRDS 버튼 공통: medium 높이 48px · 모서리 6px · 글자 17px. 크기·색은 아래 조합을 덧붙여 쓴다.
export const buttonClass =
  "inline-flex h-12 items-center justify-center gap-1 rounded-md px-5 text-base font-medium focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

// KRDS 버튼 색 3단계
// primary: 채운 파랑(primary-50 → hover 60 → 누름 70), 흰 글씨
export const buttonPrimary =
  "border border-primary bg-primary text-fg-inverse hover:border-primary-hover hover:bg-primary-hover active:bg-primary-pressed";
// secondary: 연한 파랑 바탕(primary-5) + 파랑 테두리, 파랑 글씨
export const buttonSecondary =
  "border border-primary bg-surface-primary text-fg-primary hover:bg-button-secondary-hover";
// tertiary: 흰 바탕 + 진회색 테두리(gray-60), 기본 글씨
export const buttonTertiary = "border border-line-dark bg-surface text-fg hover:bg-button-tertiary-hover";

// 안내 상자(KRDS 시스템 색): 연한 바탕(-5) + 옅은 테두리(-10) + 진한 글씨(-60). 아이콘 글자(⚠·ℹ)를 함께 써서 색만으로 구분하지 않는다.
export const noticeClass = {
  warning: "rounded-lg border border-line-warning-light bg-surface-warning p-3 text-sm text-fg-warning",
  information:
    "rounded-lg border border-line-information-light bg-surface-information p-3 text-sm text-fg-information",
  danger: "rounded-lg border border-line-danger-light bg-surface-danger p-3 text-sm text-fg-danger",
} as const;

// 접이식(details) 제목줄 공통 모양 (KRDS 아코디언: 제목 Bold, 오른쪽 화살표가 열리면 돌아간다)
export const summaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 rounded-md font-bold text-fg-bolder [&::-webkit-details-marker]:hidden";
export const summaryIconClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-lg text-fg-subtle transition-transform group-open:rotate-90";
// 규정·근거 목록 한 줄 (gray-5 바탕의 연한 칸)
export const ruleItemClass = "rounded-md bg-surface-subtle px-4 py-3";

// 입력 단계 제목: 파란 네모 번호 배지 + 제목 (예: 1 기본 정보). 번호는 장식이라 화면 읽기에는 제목만 읽힌다.
// KRDS heading-small(19px)·Bold, 제목 아래 gray-20 구분선
export function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 border-b border-line-light pb-3 text-lg font-bold text-fg-bolder">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-fg-inverse"
      >
        {step}
      </span>
      {title}
    </h2>
  );
}

// 안내 글(hint)의 id. 입력칸의 aria-describedby에 연결해 화면 읽기 프로그램이 안내를 읽게 한다
export function hintId(htmlFor: string): string {
  return `${htmlFor}-hint`;
}

// aria-describedby 값 만들기 (값이 있는 id만 공백으로 이어 붙임)
export function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const list = ids.filter((id): id is string => Boolean(id));
  return list.length > 0 ? list.join(" ") : undefined;
}

// 칸 하나: 이름표 + 입력칸 + (있으면) 안내 글 + (있으면) 오류 문구
export function Field({
  label,
  htmlFor,
  error,
  errorId,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: ErrorCode;
  errorId?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {/* KRDS 폼 라벨: label-medium(17px)·Medium, 라벨과 입력칸 사이 8px */}
      <label htmlFor={htmlFor} className="mb-2 block text-base font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId(htmlFor)} className="mt-2 text-sm text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-fg-danger">
          ⚠ {ERROR_MESSAGES[error]}
        </p>
      )}
    </div>
  );
}
