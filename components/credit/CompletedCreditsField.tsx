"use client";

import { useId } from "react";
import type { ErrorCode } from "@/lib/credit";
import { describedBy, Field, hintId, inputClass } from "./Field";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: ErrorCode;
}

// ③ 지금까지 이수한 학점 (필수, 0 이상, 0.5 단위)
export default function CompletedCreditsField({ value, onChange, error }: Props) {
  const id = useId();
  return (
    <Field
      label="지금까지 이수한 학점"
      htmlFor={`${id}-credits`}
      error={error}
      errorId={`${id}-credits-error`}
      hint="0.5학점 단위로 입력하세요. 아직 들은 교육이 없으면 0을 입력하세요."
    >
      {/* 폭 제한은 입력칸에만 둔다 (안내 문장까지 좁아져 줄바꿈되는 것을 막기 위함) */}
      <div className="flex max-w-xs items-center gap-2">
        <input
          id={`${id}-credits`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={inputClass}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId(`${id}-credits`), error && `${id}-credits-error`)}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="shrink-0">학점</span>
      </div>
    </Field>
  );
}
