import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// KRDS 기본 글꼴 Pretendard GOV (공식 패키지 krds-uiux에 들어 있는 한글 서브셋 글꼴, SIL OFL 1.1)
// 내 서버에서 직접 내려주므로 외부 글꼴 서버에 접속하지 않는다.
const pretendardGov = localFont({
  src: [
    { path: "./fonts/PretendardGOV-Regular.subset.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PretendardGOV-Medium.subset.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PretendardGOV-Bold.subset.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard-gov",
  display: "swap",
});

export const metadata: Metadata = {
  title: "내 교육학점 계산기",
  description: "직급과 부재 기간을 입력하면 선택한 연도의 목표 교육학점과 남은 학점을 계산해 줍니다.",
  // 사내용 자료이므로 검색엔진에 노출·저장되지 않게 한다 (X-Robots-Tag 머리글과 함께 이중으로 막음)
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendardGov.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
