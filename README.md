# NSU Blog Studio

React + Vite + TypeScript + Tailwind CSS 4.3.2 기반 블로그 앱입니다.

## 실행

```bash
npm install
npm run db:setup
npm run dev:api
npm run dev:web
```

`dev:api`는 백엔드 API 서버를 `http://127.0.0.1:4175`에서 실행합니다.
`dev:web`은 Vite 프론트엔드를 실행하고 `/api` 요청을 백엔드로 프록시합니다.
`db:setup`은 `.env`의 MySQL 접속 정보로 `MYSQL_DATABASE` 데이터베이스와 `admin_auth`, `posts`, `site_settings` 테이블을 생성합니다. 첫 실행 때 기본 글도 DB에 넣습니다.

보안 관련 설정은 `.env`에 둡니다. 예시는 `.env.example`을 참고하세요. `.env`와 `server/.env`는 GitHub에 올리지 않습니다.

## 구성

- 글 작성, 목록, 상세 보기
- `/admin` 메인페이지 관리 화면
- 메인 문구, 히어로 이미지, 소개 섹션, 최신글 개수, 섹션 순서 수정
- 카테고리 필터
- 백엔드 API 저장 또는 localStorage fallback
- Node + TypeScript 백엔드 API
- MySQL 기반 관리자 인증 저장소
- MySQL 기반 게시글 CRUD 저장소
- 서버 저장 PBKDF2 비밀번호 해시
- 세션 토큰 기반 글쓰기 접근 제어
- `dangerouslySetInnerHTML` 미사용
- 입력값 길이 제한과 제어문자 제거
- 기본 CSP 메타 태그 적용
- 애드센스용 `public/ads.txt` 자리표시자 포함

## 관리자 로그인

기본 아이디는 `seung`입니다. 첫 로그인 때 입력한 8자 이상 비밀번호가 관리자 비밀번호로 설정됩니다.
비밀번호 원문은 저장하지 않고 MySQL `admin_auth` 테이블에 PBKDF2 해시로 저장됩니다. `server/data/`와 `.env`는 Git에 커밋되지 않습니다.

## 백엔드 API

```text
GET    /api/health
POST   /api/auth/login
GET    /api/auth/me
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
GET    /api/home-settings
PUT    /api/home-settings
```

글 생성, 수정, 삭제와 메인페이지 설정 저장은 로그인 토큰이 있어야 합니다. 프론트는 `VITE_API_BASE_URL`이 설정되어 있으면 해당 API 서버를 사용하고, 없으면 GitHub Pages에서도 깨지지 않도록 브라우저 저장소를 fallback으로 사용합니다.

실제 배포 시에는 백엔드 서버 환경 변수에 `CORS_ORIGIN=https://dysco.co.kr`를 넣고, 프론트 빌드 환경 변수에 배포된 API 주소를 넣습니다.

```bash
$env:VITE_API_BASE_URL="https://api.example.com"
npm run build
```

## 애드센스 연결

현재 앱은 보안을 우선해서 외부 스크립트를 기본 차단합니다. 애드센스 승인 후에는 본인 Publisher ID로 `ads.txt`를 바꾸고, Google AdSense 공식 안내에 맞춰 광고 스크립트와 CSP 허용 도메인을 명시적으로 추가하세요.

## 검색엔진 SEO 등록

빌드 시 `public/sitemap.xml`, `public/robots.txt`, `dist/404.html`이 생성됩니다. 기본 사이트 주소는 GitHub Pages 기준 `https://nsy-nsy.github.io/nsu-blog-app`입니다.

도메인이 바뀌면 빌드 전에 환경 변수로 실제 주소를 지정하세요.

```bash
$env:VITE_SITE_URL="https://example.com"
$env:VITE_BASE_PATH="/"
npm run build
```

Google Search Console과 Naver Search Advisor에서 사이트를 등록한 뒤 발급받은 인증 코드는 `index.html`의 주석 처리된 verification meta 태그에 넣으면 됩니다. 등록 후 각 콘솔에 `sitemap.xml` 주소를 제출하세요.
