"use client";

import { useId } from "react";
import {
  ABSENCE_REASONS,
  NEW_HIRE_REASON,
  checkPeriodFit,
  evaluationPeriod,
  type AbsenceErrors,
  type AbsenceInput,
  type AbsenceReason,
  type PeriodFit,
} from "@/lib/credit";
import {
  buttonClass,
  buttonTertiary,
  describedBy,
  Field,
  hintId,
  inputClass,
  noticeClass,
} from "./Field";

interface Props {
  index: number; // 화면에 보이는 줄 번호 (1부터)
  year: number | null; // 선택한 계산 연도 (화면이 브라우저에 뜨기 전에는 null)
  newHireTaken: boolean; // 다른 줄에서 이미 신규채용을 골랐는지 (신규채용은 한 번만 가능)
  overlaps: boolean; // 다른 부재 기간과 겹치는 날이 있는지
  absence: AbsenceInput;
  errors?: AbsenceErrors;
  onChange: (patch: Partial<AbsenceInput>) => void;
  onRemove: () => void;
}

// 부재 기간 한 줄: 사유 + 시작일·복직일 (신규채용이면 입사일 하나만)
export default function AbsenceRow({
  index,
  year,
  newHireTaken,
  overlaps,
  absence,
  errors,
  onChange,
  onRemove,
}: Props) {
  const id = useId();
  const isNewHire = absence.reason === NEW_HIRE_REASON;
  // 입력한 기간이 계산 연도에 해당하는지 — 날짜를 넣는 즉시 안내한다 (계산을 막지는 않고 해당 기간만 뺀다)
  const period = year === null ? null : evaluationPeriod(year);
  const fit: PeriodFit = year === null ? { kind: "unknown" } : checkPeriodFit(absence, year);
  // 시작일·복직일이 모두 비었을 때는 같은 오류 문구를 두 번 보여주지 않고 시작일 아래에 한 번만 보여준다
  const bothDatesMissing =
    errors?.startDate === "DATE_REQUIRED" && errors?.returnDate === "DATE_REQUIRED";

  return (
    <li className="rounded-lg border border-line-light bg-surface-subtle p-4">
      {/* 줄마다 이름표(부재 사유·시작일·복직일)가 같으므로, 화면 읽기에서 몇 번째 줄인지 알 수 있게 묶음 이름을 붙인다 */}
      <div role="group" aria-labelledby={`${id}-title`}>
      <div className="mb-3 flex items-center justify-between">
        <span id={`${id}-title`} className="font-bold text-fg-bolder">
          부재 {index}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`부재 ${index} 삭제`}
          className={`${buttonClass} ${buttonTertiary} h-10 rounded-sm px-4 text-sm`}
        >
          삭제
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="부재 사유"
          htmlFor={`${id}-reason`}
          error={errors?.reason}
          errorId={`${id}-reason-error`}
        >
          <select
            id={`${id}-reason`}
            className={inputClass}
            value={absence.reason}
            aria-invalid={errors?.reason ? true : undefined}
            aria-describedby={errors?.reason ? `${id}-reason-error` : undefined}
            onChange={(e) => onChange({ reason: e.target.value as AbsenceReason | "" })}
          >
            <option value="">사유 선택</option>
            {ABSENCE_REASONS.map((reason) => {
              // 신규채용은 한 번만 고를 수 있다 (이미 다른 줄에서 골랐으면 선택 불가)
              const taken = reason === NEW_HIRE_REASON && newHireTaken;
              return (
                <option key={reason} value={reason} disabled={taken}>
                  {taken ? `${reason} (이미 입력됨)` : reason}
                </option>
              );
            })}
          </select>
        </Field>

        {isNewHire ? (
          <Field
            label="입사일"
            htmlFor={`${id}-hire`}
            error={errors?.hireDate}
            errorId={`${id}-hire-error`}
            hint="계산 연도 시작일부터 입사일 전날까지를 부재로 봅니다"
            className="sm:col-span-2"
          >
            <input
              id={`${id}-hire`}
              type="date"
              className={inputClass}
              value={absence.hireDate}
              aria-invalid={errors?.hireDate ? true : undefined}
              aria-describedby={describedBy(hintId(`${id}-hire`), errors?.hireDate && `${id}-hire-error`)}
              onChange={(e) => onChange({ hireDate: e.target.value })}
            />
          </Field>
        ) : (
          <>
            <Field
              label="시작일"
              htmlFor={`${id}-start`}
              error={errors?.startDate}
              errorId={`${id}-start-error`}
            >
              <input
                id={`${id}-start`}
                type="date"
                className={inputClass}
                value={absence.startDate}
                aria-invalid={errors?.startDate ? true : undefined}
                aria-describedby={errors?.startDate ? `${id}-start-error` : undefined}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </Field>
            <Field
              label="복직일 (복직 예정일)"
              htmlFor={`${id}-return`}
              error={bothDatesMissing ? undefined : (errors?.returnDate ?? errors?.range)}
              errorId={`${id}-return-error`}
            >
              <input
                id={`${id}-return`}
                type="date"
                className={inputClass}
                value={absence.returnDate}
                aria-invalid={errors?.returnDate || errors?.range ? true : undefined}
                aria-describedby={
                  bothDatesMissing
                    ? `${id}-start-error` // 같은 문구는 시작일 아래에 한 번만 있으므로 그쪽을 읽게 한다
                    : errors?.returnDate || errors?.range
                      ? `${id}-return-error`
                      : undefined
                }
                onChange={(e) => onChange({ returnDate: e.target.value })}
              />
            </Field>
          </>
        )}
      </div>

      {period && fit.kind === "outside" && (
        <p
          role="status"
          className={`mt-3 ${noticeClass.warning}`}
        >
          ⚠ 이 부재 기간은 선택한 계산 연도({period.start} ~ {period.end})에 해당하지 않아 계산에
          반영되지 않습니다. 날짜나 계산 연도를 확인해 주세요.
        </p>
      )}
      {period && fit.kind === "partial" && (
        <p
          role="status"
          className={`mt-3 ${noticeClass.information}`}
        >
          ℹ 계산 연도({period.start} ~ {period.end}) 밖의 기간은 제외하고,{" "}
          {fit.from === fit.to ? `${fit.from} 하루만` : `${fit.from} ~ ${fit.to}만`} 반영됩니다.
        </p>
      )}
      {period && fit.kind === "hireAfterYear" && (
        <p
          role="status"
          className={`mt-3 ${noticeClass.warning}`}
        >
          ⚠ 입사일이 계산 연도 종료일({period.end}) 이후라 선택한 연도 전체가 부재 기간으로
          계산되며, 이수 의무가 없는 것으로 나옵니다. 입사일이나 계산 연도를 확인해 주세요.
        </p>
      )}
      {period && fit.kind === "hireBeforeYear" && (
        <p
          role="status"
          className={`mt-3 ${noticeClass.information}`}
        >
          ℹ 입사일이 계산 연도 시작일({period.start}) 이전(또는 같음)이라 신규채용으로 인한 부재는
          없습니다.
        </p>
      )}
      {overlaps && (
        <p
          role="status"
          className={`mt-3 ${noticeClass.information}`}
        >
          ℹ 다른 부재 기간과 겹치는 날이 있습니다. 겹친 날은 한 번만 계산합니다.
        </p>
      )}
      </div>
    </li>
  );
}
