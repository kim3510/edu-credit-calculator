"use client";

import { useId } from "react";
import { ERROR_MESSAGES, evaluationPeriod, GRADES, type ErrorCode, type Grade } from "@/lib/credit";
import { describedBy, Field, hintId, inputClass } from "./Field";

interface Props {
  year: number | null; // 화면이 브라우저에 뜨기 전에는 null
  yearOptions: number[];
  onYearChange: (year: number) => void;
  grade: Grade | "";
  onGradeChange: (grade: Grade | "") => void;
  gradeError?: ErrorCode;
}

// ① 기본 정보: 계산 연도(학점평가 연도)와 직급
export default function BasicInfoFields({
  year,
  yearOptions,
  onYearChange,
  grade,
  onGradeChange,
  gradeError,
}: Props) {
  const id = useId();
  const period = year === null ? null : evaluationPeriod(year);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="계산 연도 (학점평가 연도)"
        htmlFor={`${id}-year`}
        hint={period ? `${period.start} ~ ${period.end} 기간 기준` : "불러오는 중…"}
      >
        <select
          id={`${id}-year`}
          className={inputClass}
          value={year ?? ""}
          aria-describedby={hintId(`${id}-year`)}
          disabled={year === null}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {year === null && <option value="">불러오는 중…</option>}
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </Field>

      {/* 직급: 드롭다운 대신 알약 모양 선택 버튼. 한 번에 보이고 한 번에 고를 수 있다 (정부24의 칩 선택 방식 참고).
          실제 라디오 버튼이라 키보드(Tab·방향키)와 화면 읽기가 그대로 동작한다. */}
      <fieldset
        role="radiogroup"
        aria-invalid={gradeError ? true : undefined}
        aria-describedby={describedBy(hintId(`${id}-grade`), gradeError && `${id}-grade-error`)}
      >
        <legend className="mb-2 block text-base font-medium text-fg">직급</legend>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <label key={g} className="cursor-pointer">
              <input
                type="radio"
                name={`${id}-grade`}
                value={g}
                checked={grade === g}
                onChange={() => onGradeChange(g)}
                className="peer sr-only"
              />
              {/* KRDS 라디오 칩 medium: 높이 48px · 모서리 6px · gray-30 테두리.
                  선택되면 연한 파랑(primary-10) 바탕 + 파랑 테두리 + 파랑 글씨. 키보드 초점은 KRDS 초점 띠와 같은 모양 */}
              <span
                className={`inline-flex h-12 min-w-16 items-center justify-center rounded-md border bg-surface px-5 text-base font-medium text-fg transition-colors hover:bg-button-tertiary-hover peer-checked:border-2 peer-checked:border-primary peer-checked:bg-surface-primary-selected peer-checked:px-[19px] peer-checked:font-bold peer-checked:text-fg-primary peer-focus-visible:shadow-[0_0_0_2px_var(--krds-surface),0_0_0_6px_var(--krds-primary)] ${
                  gradeError ? "border-line-danger" : "border-line"
                }`}
              >
                {g}
              </span>
            </label>
          ))}
        </div>
        <p id={hintId(`${id}-grade`)} className="mt-2 text-sm text-fg-subtle">
          평가 종료일(11월 30일) 기준 직급을 고르세요. 승진해도 기간을 나누지 않습니다.
        </p>
        {gradeError && (
          <p id={`${id}-grade-error`} className="mt-2 text-sm text-fg-danger">
            ⚠ {ERROR_MESSAGES[gradeError]}
          </p>
        )}
      </fieldset>
    </div>
  );
}
