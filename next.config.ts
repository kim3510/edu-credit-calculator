import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 내용 보안 정책(CSP): 이 앱은 외부에서 받아 오는 것이 없으므로 모든 것을 같은 주소(self)로 제한한다.
// - 일회용 값(nonce) 방식은 쓰지 않는다: cacheComponents(미리 그려 두는 방식)와 맞지 않는다 (Next.js 안내서).
//   그래서 Next.js가 넣는 인라인 스크립트·스타일을 위해 'unsafe-inline'을 허용한다.
// - 개발 중에는 화면 자동 갱신(HMR)에 필요한 'unsafe-eval'과 웹소켓을 허용한다.
// - upgrade-insecure-requests는 http://localhost 개발 화면을 깨뜨리므로 배포본에서만 넣는다.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 사용 기술(Next.js)을 알려 주는 X-Powered-By 머리글을 끈다
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // 다른 사이트가 이 화면을 틀(iframe) 안에 넣어 보여 주는 것을 막는다
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          // 카메라·마이크·위치 등 쓰지 않는 기능을 끈다 (결과 복사에 필요한 clipboard-write는 건드리지 않는다)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // 사내용 자료이므로 검색엔진에 저장되지 않게 한다
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
