# NSU Blog Studio

React + Vite + TypeScript + Tailwind CSS 4.3.2 기반 블로그 앱입니다.

## 실행

```bash
npm install
npm run dev
```

## 구성

- 글 작성, 목록, 상세 보기
- 카테고리 필터
- localStorage 저장
- `dangerouslySetInnerHTML` 미사용
- 입력값 길이 제한과 제어문자 제거
- 기본 CSP 메타 태그 적용
- 애드센스용 `public/ads.txt` 자리표시자 포함

## 애드센스 연결

현재 앱은 보안을 우선해서 외부 스크립트를 기본 차단합니다. 애드센스 승인 후에는 본인 Publisher ID로 `ads.txt`를 바꾸고, Google AdSense 공식 안내에 맞춰 광고 스크립트와 CSP 허용 도메인을 명시적으로 추가하세요.
