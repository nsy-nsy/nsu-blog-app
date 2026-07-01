import type { Post, WeekPlan } from "./types";

export const weekPlans: WeekPlan[] = [
  {
    week: "1주차",
    title: "웹 개발 기초와 첫 배포",
    timecode: "0:00 - 1:12:13",
    summary: "HTML, CSS, JavaScript의 역할을 익히고 AI 코딩 도구로 작은 웹 서비스를 직접 만들고 배포합니다.",
    stack: ["ChatGPT", "Claude", "HTML", "CSS", "JavaScript", "Formspree", "Disqus", "AdSense"],
  },
  {
    week: "2주차",
    title: "데이터 기반 프로덕트 전략",
    timecode: "1:14:27 - 1:38:08",
    summary: "Google Analytics와 MS Clarity로 행동 데이터를 모으고 AARRR, PMF, Aha Moment를 점검합니다.",
    stack: ["Google Analytics", "MS Clarity", "AARRR", "PMF", "Aha Moment"],
  },
  {
    week: "3주차",
    title: "React 기반 AI 서비스 구현",
    timecode: "1:38:08 - 2:11:26",
    summary: "React와 Vite로 확장 가능한 프론트엔드를 만들고 OpenAI API로 텍스트/이미지 생성 기능을 붙입니다.",
    stack: ["React", "Vite", "TypeScript", "OpenAI API", "Image API"],
  },
  {
    week: "4주차",
    title: "데이터베이스와 파일 인프라",
    timecode: "2:11:26 - 2:24:00",
    summary: "Supabase로 사용자 데이터와 인증을 다루고 Cloudflare R2로 이미지와 파일 저장 문제를 해결합니다.",
    stack: ["Supabase", "Auth", "Postgres", "Cloudflare R2", "Storage"],
  },
  {
    week: "5주차",
    title: "앱 출시, 마케팅, Exit 전략",
    timecode: "2:24:00 - 3:14:01",
    summary: "Expo로 앱을 확장하고 퍼포먼스 마케팅, Stripe Atlas, 매각 전략까지 사업화 흐름을 정리합니다.",
    stack: ["Expo", "Performance Marketing", "Stripe Atlas", "Exit"],
  },
];

export const starterPosts: Post[] = [
  {
    id: "starter-roadmap",
    title: "AI로 1인 창업형 블로그를 만드는 5주 로드맵",
    category: "로드맵",
    excerpt: "조코딩 부트캠프 요약을 바탕으로 웹 개발, 데이터 분석, AI 기능, 인프라, 마케팅까지 연결한 실행 계획입니다.",
    body:
      "이 블로그의 목적은 단순히 글을 쌓는 것이 아니라, 실제 수익형 IT 프로덕트로 확장 가능한 기록을 만드는 것입니다.\n\n1주차에는 HTML, CSS, JavaScript로 가장 작은 웹 서비스를 만들고 배포합니다. 2주차에는 Google Analytics와 MS Clarity로 사용자 행동을 관찰합니다. 3주차에는 React와 Vite 기반으로 앱 구조를 만들고 OpenAI API를 붙입니다. 4주차에는 Supabase와 Cloudflare R2로 데이터를 저장합니다. 5주차에는 Expo, 마케팅, 법인 설립, Exit 전략까지 확장합니다.\n\n핵심은 한 번에 완벽한 서비스를 만들려는 태도가 아니라, 배포 가능한 작은 단위를 빠르게 만들고 사용자 반응을 보며 개선하는 것입니다.",
    createdAt: "2026-07-02T00:00:00.000Z",
    readMinutes: 4,
    tags: ["AI창업", "로드맵", "수익형블로그"],
  },
  {
    id: "starter-web",
    title: "1주차: HTML, CSS, JavaScript로 수익형 페이지의 뼈대 만들기",
    category: "웹개발",
    excerpt: "개발 환경이 복잡하지 않아도 브라우저와 AI 코딩 도구만으로 첫 서비스를 만들 수 있습니다.",
    body:
      "처음 만드는 수익형 웹사이트는 화려한 기능보다 명확한 목적이 중요합니다. 사용자가 어떤 문제를 해결하러 들어오는지, 첫 화면에서 무엇을 해야 하는지, 문의나 댓글처럼 반응을 남길 통로가 있는지부터 봐야 합니다.\n\nFormspree는 별도 백엔드 없이 문의 폼을 받을 수 있고, Disqus는 댓글 시스템을 빠르게 붙일 수 있습니다. 애드센스는 승인 이후 광고 수익화의 시작점이 되지만, 광고보다 먼저 고유 콘텐츠와 읽기 쉬운 구조가 준비되어야 합니다.\n\n이 단계의 목표는 '작동하는 페이지를 배포했다'는 경험을 만드는 것입니다.",
    createdAt: "2026-07-02T00:10:00.000Z",
    readMinutes: 5,
    tags: ["HTML", "CSS", "JavaScript", "AdSense"],
  },
  {
    id: "starter-data",
    title: "2주차: AARRR과 Aha Moment로 블로그 성장 지표 읽기",
    category: "데이터분석",
    excerpt: "방문자 수만 보는 대신 유입, 활성화, 재방문, 추천, 수익화 흐름을 나눠서 봐야 합니다.",
    body:
      "수익형 블로그나 작은 IT 프로덕트는 감으로만 운영하면 개선 방향을 놓치기 쉽습니다. Google Analytics는 유입 경로와 페이지 성과를 보여주고, MS Clarity는 사용자가 어디에서 멈추고 클릭하는지 시각적으로 확인하게 해줍니다.\n\nAARRR은 Acquisition, Activation, Retention, Referral, Revenue의 흐름입니다. 블로그로 바꾸면 검색 유입, 글 완독, 재방문, 공유, 광고 또는 상품 수익으로 해석할 수 있습니다.\n\nAha Moment는 사용자가 '이 사이트 계속 써야겠다'고 느끼는 순간입니다. 이 블로그에서는 실전 체크리스트, 코드 예시, 배포 가능한 템플릿이 그 순간이 될 수 있습니다.",
    createdAt: "2026-07-02T00:20:00.000Z",
    readMinutes: 5,
    tags: ["GA4", "Clarity", "AARRR", "PMF"],
  },
  {
    id: "starter-ai",
    title: "3주차: React와 OpenAI API로 블로그를 AI 서비스로 확장하기",
    category: "AI서비스",
    excerpt: "단순 글 목록에서 끝내지 않고 요약, 제목 추천, 이미지 생성 같은 기능으로 프로덕트화할 수 있습니다.",
    body:
      "React와 Vite는 블로그를 정적인 페이지에서 앱 형태로 확장하기 좋은 조합입니다. 글쓰기, 필터, 검색, 저장, 설정처럼 상태가 필요한 기능을 체계적으로 만들 수 있습니다.\n\nOpenAI API를 연결하면 글 제목 추천, 본문 요약, SEO 메타 설명 생성, 썸네일 아이디어 생성 같은 기능을 붙일 수 있습니다. 이미지 생성 API는 글 주제에 맞는 대표 이미지를 만드는 데 활용할 수 있습니다.\n\n다만 API 키는 절대 프론트엔드 코드에 직접 넣으면 안 됩니다. 실제 서비스에서는 서버나 서버리스 함수에서 키를 보호하고 요청 제한을 둬야 합니다.",
    createdAt: "2026-07-02T00:30:00.000Z",
    readMinutes: 6,
    tags: ["React", "Vite", "OpenAI", "API보안"],
  },
  {
    id: "starter-infra",
    title: "4주차: Supabase와 Cloudflare R2로 운영 가능한 구조 만들기",
    category: "인프라",
    excerpt: "브라우저 저장을 넘어 실제 사용자 데이터, 인증, 이미지 저장을 다루는 단계입니다.",
    body:
      "지금 앱의 글쓰기 기능은 localStorage에 저장됩니다. 데모로는 충분하지만 실제 블로그 운영에서는 기기 변경, 백업, 권한 관리 문제가 생깁니다.\n\nSupabase를 쓰면 Postgres 데이터베이스, 인증, 권한 정책을 비교적 빠르게 붙일 수 있습니다. 글, 사용자, 댓글, 북마크 같은 데이터를 서버에 저장할 수 있고, Row Level Security로 권한을 세밀하게 관리할 수 있습니다.\n\nCloudflare R2는 이미지와 파일 저장에 적합합니다. 블로그 썸네일, 생성 이미지, 첨부 파일처럼 용량이 커지는 자산은 데이터베이스와 분리해 스토리지에 두는 편이 좋습니다.",
    createdAt: "2026-07-02T00:40:00.000Z",
    readMinutes: 5,
    tags: ["Supabase", "Postgres", "R2", "Storage"],
  },
  {
    id: "starter-marketing",
    title: "5주차: 앱, 마케팅, Exit까지 생각하는 운영 전략",
    category: "마케팅",
    excerpt: "블로그가 트래픽을 만들면 앱, 상품, 뉴스레터, 매각 가능한 자산으로 확장할 수 있습니다.",
    body:
      "Expo를 사용하면 웹에서 검증한 아이디어를 모바일 앱으로 확장할 수 있습니다. 처음부터 앱을 만들기보다, 웹에서 사용자의 문제와 반복 사용 이유를 확인한 뒤 앱으로 옮기는 편이 안전합니다.\n\n퍼포먼스 마케팅은 돈을 쓰는 일이므로 전환 지표가 준비된 뒤 시작해야 합니다. 어떤 글이 가입이나 구매로 이어지는지, 어떤 키워드가 광고 수익을 만드는지 추적해야 합니다.\n\nStripe Atlas 같은 도구는 글로벌 결제와 법인 설립을 고민할 때 등장합니다. Exit은 거창한 말처럼 들리지만, 결국 누가 인수하고 싶을 만큼 데이터, 사용자, 수익, 운영 문서가 정리되어 있는지가 핵심입니다.",
    createdAt: "2026-07-02T00:50:00.000Z",
    readMinutes: 6,
    tags: ["Expo", "마케팅", "Stripe", "Exit"],
  },
];
