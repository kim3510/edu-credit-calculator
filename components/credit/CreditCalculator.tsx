"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  runCalculation,
  type AbsenceInput,
  type CalculationResult,
  type CalculatorInput,
  type Grade,
  type ValidationErrors,
} from "@/lib/credit";
import AbsenceList, { ADD_ABSENCE_BUTTON_ID } from "./AbsenceList";
import BasicInfoFields from "./BasicInfoFields";
import CompletedCreditsField from "./CompletedCreditsField";
import { buttonClass, buttonPrimary, buttonTertiary, cardClass, StepHeading } from "./Field";
import ResultCard from "./ResultCard";
import RulesGuide from "./RulesGuide";
import { useDefaultYear } from "./useDefaultYear";

const NO_ERRORS: ValidationErrors = { absences: {} };
const YEARS_AHEAD = 5; // 기본 연도에서 몇 년 뒤까지 고를 수 있는지

// 입력 상태를 보관하고 "계산하기"를 처리한다. 입력값은 이 화면의 메모리에만 있고 어디에도 저장·전송하지 않는다.
export default function CreditCalculator() {
  const defaultYear = useDefaultYear();
  const [yearChoice, setYearChoice] = useState<number | null>(null);
  const year = yearChoice ?? defaultYear; // 사용자가 고르기 전에는 기본 연도
  const [grade, setGrade] = useState<Grade | "">("");
  const [absences, setAbsences] = useState<AbsenceInput[]>([]);
  const [noAbsence, setNoAbsence] = useState(false);
  const [completedCredits, setCompletedCredits] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>(NO_ERRORS);
  const [calculated, setCalculated] = useState<{ result: CalculationResult; key: string } | null>(
    null,
  );
  const [focusTick, setFocusTick] = useState(0);
  const [resultFocusTick, setResultFocusTick] = useState(0);
  const nextAbsenceId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const input: CalculatorInput | null =
    year === null ? null : { year, grade, absences, noAbsence, completedCredits };
  // 결과를 낸 뒤 입력이 바뀌었는지 (바뀌었으면 이전 결과를 흐리게 보여준다)
  const stale = calculated !== null && calculated.key !== JSON.stringify(input);

  // 계산 연도는 지금 해당하는 평가 연도(기본값)부터 5년 뒤까지만 고를 수 있다. 지난 연도는 계산하지 않는다.
  const yearOptions =
    defaultYear === null ? [] : Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => defaultYear + i);

  // 계산하기를 눌렀는데 오류가 있으면 첫 번째 오류 칸으로 이동한다
  useEffect(() => {
    if (focusTick === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    // 직급처럼 여러 버튼을 묶은 칸(fieldset)이 오류면, 그 안의 첫 번째 버튼으로 초점을 옮긴다
    const target = first instanceof HTMLFieldSetElement ? first.querySelector("input") : first;
    target?.focus();
  }, [focusTick]);

  // 계산에 성공하면 키보드 초점을 결과 제목으로 옮긴다 (화면 읽기 프로그램이 결과를 읽도록)
  useEffect(() => {
    if (resultFocusTick === 0) return;
    document.getElementById("result-title")?.focus();
  }, [resultFocusTick]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (input === null) return;
    const outcome = runCalculation(input);
    if (outcome.ok) {
      setErrors(NO_ERRORS);
      setCalculated({ result: outcome.result, key: JSON.stringify(input) });
      setResultFocusTick((tick) => tick + 1);
    } else {
      setErrors(outcome.errors);
      setCalculated(null); // 오류가 있으면 이전 결과는 치운다
      setFocusTick((tick) => tick + 1);
    }
  }

  // 모든 입력과 결과를 지우고 처음 상태로 돌린다 (다른 직원을 이어서 계산할 때)
  function handleReset() {
    setYearChoice(null);
    setGrade("");
    setAbsences([]);
    setNoAbsence(false);
    setCompletedCredits("");
    setErrors(NO_ERRORS);
    setCalculated(null);
    window.scrollTo({ top: 0 });
  }

  function addAbsence() {
    nextAbsenceId.current += 1;
    const id = `absence-${nextAbsenceId.current}`;
    setAbsences((prev) => [...prev, { id, reason: "", startDate: "", returnDate: "", hireDate: "" }]);
    setErrors((prev) => ({ ...prev, absenceChoice: undefined })); // 부재를 입력하기 시작했으니 선택 요구 문구는 지운다
  }

  function changeNoAbsence(checked: boolean) {
    setNoAbsence(checked);
    setErrors((prev) => ({ ...prev, absenceChoice: undefined }));
  }

  function changeAbsence(id: string, patch: Partial<AbsenceInput>) {
    setAbsences((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    clearAbsenceError(id);
  }

  function removeAbsence(id: string) {
    setAbsences((prev) => prev.filter((a) => a.id !== id));
    clearAbsenceError(id);
    // 삭제한 줄의 버튼이 사라지면 키보드 초점도 사라지므로, "부재 기간 추가" 버튼으로 옮긴다
    setTimeout(() => document.getElementById(ADD_ABSENCE_BUTTON_ID)?.focus(), 0);
  }

  // 고친 칸의 오류 문구는 바로 지운다
  function clearAbsenceError(id: string) {
    setErrors((prev) => {
      if (!(id in prev.absences)) return prev;
      const { [id]: removed, ...rest } = prev.absences;
      void removed;
      return { ...prev, absences: rest };
    });
  }

  return (
    // PC(큰 화면)에서는 왼쪽 입력 · 오른쪽 결과의 두 칸, 휴대폰에서는 위아래 한 칸 (D-24)
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className={cardClass}>
          <StepHeading step={1} title="기본 정보" />
          <BasicInfoFields
            year={year}
            yearOptions={yearOptions}
            onYearChange={setYearChoice}
            grade={grade}
            onGradeChange={(value) => {
              setGrade(value);
              setErrors((prev) => ({ ...prev, grade: undefined }));
            }}
            gradeError={errors.grade}
          />
        </section>

        <section className={cardClass}>
          <StepHeading step={2} title="부재 기간" />
          <AbsenceList
            year={year}
            absences={absences}
            errors={errors.absences}
            noAbsence={noAbsence}
            choiceError={errors.absenceChoice}
            onNoAbsenceChange={changeNoAbsence}
            onChange={changeAbsence}
            onAdd={addAbsence}
            onRemove={removeAbsence}
          />
        </section>

        <section className={cardClass}>
          <StepHeading step={3} title="이수한 학점" />
          <CompletedCreditsField
            value={completedCredits}
            onChange={(value) => {
              setCompletedCredits(value);
              setErrors((prev) => ({ ...prev, completedCredits: undefined }));
            }}
            error={errors.completedCredits}
          />
        </section>

        {/* 버튼 줄은 화면 아래에 붙어 따라온다(sticky): 입력이 길어도 스크롤 없이 바로 계산할 수 있다 (D-26) */}
        {/* 버튼: 휴대폰은 KRDS large(높이 56px), 큰 화면은 xlarge(64px) · 모서리 8px · 글자 19px. 주 버튼(primary) + 보조 버튼(tertiary)
            flex-1은 가로로 놓일 때만 준다 (세로로 쌓일 때 주면 버튼 높이가 0 기준으로 줄어든다) */}
        <div className="sticky bottom-3 z-10 flex gap-2 rounded-2xl border border-line-light bg-surface p-2 shadow-md sm:gap-3 sm:p-3">
          <button
            type="submit"
            disabled={year === null}
            className={`${buttonClass} ${buttonPrimary} h-14 flex-1 rounded-lg px-4 text-lg font-bold sm:h-16 sm:px-8`}
          >
            계산하기
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={`${buttonClass} ${buttonTertiary} h-14 rounded-lg px-4 text-base sm:h-16 sm:px-8 sm:text-lg`}
          >
            처음부터 다시
          </button>
        </div>
      </form>

      {/* key: 입력이 달라져 새로 계산하면 결과 카드를 새로 만들어, 이전 결과의 "복사했습니다" 문구가 남지 않게 한다 */}
      {/* 결과는 연한 파란 띠 위에 흰 카드를 올려 구역을 분명히 한다 (공공 업무 사이트풍) */}
      {/* PC: 입력 칸을 내려가도 결과가 화면 안에 따라오도록 고정(sticky). 결과가 화면보다 길면 이 칸 안에서만 스크롤한다 (D-25) */}
      <div className="space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
        {calculated ? (
          <div className="rounded-2xl bg-surface-secondary p-3 sm:p-5">
            <ResultCard key={calculated.key} result={calculated.result} stale={stale} />
          </div>
        ) : (
          // 계산하기 전의 빈 자리: 넓은 화면에서 오른쪽이 텅 비어 보이지 않도록 안내만 보여준다 (휴대폰에서는 숨김)
          <div className="hidden rounded-2xl border-2 border-dashed border-line bg-surface p-10 text-center lg:block">
            {/* 마스코트 키우미: 빈 자리를 채우는 장식 이미지 (캠코 누리집 출처, page.tsx 맨 아래에 출처 표시) */}
            <Image
              src="/kamco/kiuumi-wink.png"
              alt=""
              width={557}
              height={554}
              sizes="128px"
              className="mx-auto mb-4 h-28 w-auto"
            />
            <p className="text-lg font-bold text-fg-bolder">계산 결과</p>
            <p className="mt-2 text-sm text-fg-subtle">
              정보를 입력하고 &quot;계산하기&quot;를 누르면
              <br />
              이 자리에 결과가 나옵니다.
            </p>
          </div>
        )}

        <RulesGuide />
      </div>
    </div>
  );
}
