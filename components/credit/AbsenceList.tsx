"use client";

import { useId } from "react";
import {
  ERROR_MESSAGES,
  NEW_HIRE_REASON,
  findOverlappingIds,
  type AbsenceInput,
  type ErrorCode,
  type ValidationErrors,
} from "@/lib/credit";
import AbsenceRow from "./AbsenceRow";
import { buttonClass, buttonSecondary, describedBy } from "./Field";

// "부재 기간 추가" 버튼의 id (줄을 삭제한 뒤 키보드 초점을 이 버튼으로 옮기는 데 쓴다)
export const ADD_ABSENCE_BUTTON_ID = "add-absence-button";

interface Props {
  year: number | null; // 선택한 계산 연도 (기간 안내용)
  absences: AbsenceInput[];
  errors: ValidationErrors["absences"];
  noAbsence: boolean; // "부재 기간 없음" 체크 여부
  choiceError?: ErrorCode; // 입력도 체크도 안 했을 때의 오류
  onNoAbsenceChange: (checked: boolean) => void;
  onChange: (id: string, patch: Partial<AbsenceInput>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

// ② 부재 기간: "부재 기간 없음" 체크, 또는 부재 기간 여러 건 입력
export default function AbsenceList({
  year,
  absences,
  errors,
  noAbsence,
  choiceError,
  onNoAbsenceChange,
  onChange,
  onAdd,
  onRemove,
}: Props) {
  const id = useId();
  // 다른 부재와 겹치는 줄 (겹친 날은 한 번만 계산한다는 안내용)
  const overlapping = year === null ? new Set<string>() : findOverlappingIds(absences, year);
  const newHireIds = absences.filter((a) => a.reason === NEW_HIRE_REASON).map((a) => a.id);
  const hasRows = absences.length > 0;

  return (
    <div>
      {/* 부재 기간이 없는 사람도 이수한 학점만 넣고 더 들어야 할 학점을 볼 수 있다 */}
      <div className="mb-4">
        <label className="flex items-start gap-3">
          <input
            id={`${id}-none`}
            type="checkbox"
            className="mt-0.5 h-6 w-6 shrink-0 accent-primary"
            checked={noAbsence}
            disabled={hasRows}
            aria-invalid={choiceError ? true : undefined}
            aria-describedby={describedBy(hasRows && `${id}-none-hint`, choiceError && `${id}-none-error`)}
            onChange={(e) => onNoAbsenceChange(e.target.checked)}
          />
          <span>
            <span className="font-medium">부재 기간 없음</span>
            <span className="block text-sm text-fg-subtle">
              휴직·파견 등으로 근무하지 않은 기간이 없습니다
            </span>
          </span>
        </label>
        {hasRows && (
          <p id={`${id}-none-hint`} className="mt-2 text-sm text-fg-subtle">
            입력한 부재 기간을 모두 삭제하면 체크할 수 있습니다.
          </p>
        )}
        {choiceError && (
          <p id={`${id}-none-error`} className="mt-2 text-sm text-fg-danger">
            ⚠ {ERROR_MESSAGES[choiceError]}
          </p>
        )}
      </div>

      {noAbsence ? (
        <p className="rounded-lg bg-surface-subtle p-3 text-sm text-fg-subtle">
          부재 기간 없이 계산합니다. 기준학점이 그대로 목표 학점이 됩니다.
        </p>
      ) : (
        <>
          {hasRows && (
            <ul className="mb-3 space-y-3">
              {absences.map((absence, i) => (
                <AbsenceRow
                  key={absence.id}
                  index={i + 1}
                  year={year}
                  newHireTaken={newHireIds.some((other) => other !== absence.id)}
                  overlaps={overlapping.has(absence.id)}
                  absence={absence}
                  errors={errors[absence.id]}
                  onChange={(patch) => onChange(absence.id, patch)}
                  onRemove={() => onRemove(absence.id)}
                />
              ))}
            </ul>
          )}

          <button
            id={ADD_ABSENCE_BUTTON_ID}
            type="button"
            onClick={onAdd}
            className={`${buttonClass} ${buttonSecondary} font-bold`}
          >
            + 부재 기간 추가
          </button>
          <p className="mt-3 text-sm text-fg-subtle">
            부재일은 시작일부터 복직일 전날까지 셉니다. 복직일을 모르면 복직 예정일을 넣으세요.
          </p>
        </>
      )}
    </div>
  );
}
