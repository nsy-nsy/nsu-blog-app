import type { Post } from "./types";

const roaSellaImages = [
  "posts/roa-vibram-shoes/SE-074007a6-7499-4403-9907-f8861bb985a7.jpg",
  "posts/roa-vibram-shoes/SE-755c0253-a7ff-40c5-8457-cb6f967e21f5.jpg",
  "posts/roa-vibram-shoes/SE-814bb983-6616-4ad0-b0b1-15b196a94db8.jpg",
  "posts/roa-vibram-shoes/SE-baa50a03-e7ff-4cba-822d-415714c5250c.jpg",
  "posts/roa-vibram-shoes/SE-e97420fb-a145-444a-b383-675d2916c911.jpg",
  "posts/roa-vibram-shoes/SE-f7058efb-519e-4f5c-9500-59e0531a0b9e.jpg",
  "posts/roa-vibram-shoes/SE-4c62860c-2dff-4ee0-a873-835a79cc88b4.jpg",
  "posts/roa-vibram-shoes/SE-cd51a0c2-0d2c-4abd-aa26-53e0d995b16f.jpg",
  "posts/roa-vibram-shoes/SE-bd28abf5-42a3-4684-8dda-b1dc0bc52753.jpg",
  "posts/roa-vibram-shoes/SE-42342d86-dbc6-457b-9223-9775bf156e09.jpg",
  "posts/roa-vibram-shoes/SE-98b7f7b0-6fd7-4ce8-aa74-360ff1bdc71b.jpg",
  "posts/roa-vibram-shoes/SE-b3976147-4c94-4f4c-b070-5012168bc332.jpg",
  "posts/roa-vibram-shoes/SE-0e56fb2d-cfad-44ad-83fb-59a35119355d.jpg",
  "posts/roa-vibram-shoes/SE-4ce67567-29b6-4e9d-a12d-8017b41dd2b2.jpg",
];

export const starterPosts: Post[] = [
  {
    id: "almalinux-server-install-guide",
    title: "서버용 알마리눅스 설치하는 법",
    category: "컴퓨터",
    excerpt: "AlmaLinux를 서버에 설치할 때 필요한 ISO 다운로드, USB 제작, 파티션, 네트워크, SSH 설정 순서를 정리했습니다.",
    body:
      "AlmaLinux는 CentOS 이후 서버용 리눅스를 찾는 사람들이 많이 선택하는 RHEL 계열 배포판입니다. 웹서버, 파일서버, 개발 테스트 서버처럼 안정성이 중요한 환경에 잘 어울립니다.\n\n먼저 공식 사이트에서 AlmaLinux ISO 파일을 내려받습니다. 일반 서버 설치라면 DVD ISO를 받는 편이 편하고, 최소 설치를 원하면 Minimal ISO를 선택해도 됩니다. 다운로드 후에는 Rufus 같은 프로그램으로 USB 설치 디스크를 만듭니다. 이때 부팅 방식은 사용하는 메인보드에 따라 UEFI를 우선으로 잡는 것이 좋습니다.\n\n서버 전원을 켜고 BIOS 또는 부팅 메뉴에서 USB를 선택합니다. 설치 화면이 나오면 언어를 고르고, 설치 대상 디스크를 지정합니다. 처음 연습하는 서버라면 자동 파티션으로 진행해도 충분합니다. 운영용 서버라면 /home, /var, /boot, swap 구성을 따로 잡는 편이 관리하기 좋습니다.\n\n네트워크 설정도 중요합니다. 설치 화면에서 이더넷을 켜고, 서버가 공유기나 내부망에서 IP를 받는지 확인합니다. 고정 IP를 사용할 계획이라면 설치 중에 IPv4 주소, 게이트웨이, DNS를 미리 입력해두면 이후 접속이 편합니다.\n\n소프트웨어 선택에서는 Server 또는 Minimal Install을 고릅니다. GUI가 꼭 필요하지 않다면 최소 설치가 가볍고 관리하기 좋습니다. 설치가 끝나면 재부팅 후 root 또는 생성한 사용자로 로그인합니다.\n\n처음 확인할 명령어는 간단합니다. ip addr로 IP를 보고, ping으로 인터넷 연결을 확인하고, dnf update로 패키지를 최신 상태로 맞춥니다. 원격 접속이 필요하다면 sudo systemctl enable --now sshd 명령으로 SSH를 켜고, 방화벽에서 ssh 서비스가 열려 있는지도 확인합니다.\n\n서버 설치는 한 번에 완벽하게 하려고 하기보다 설치, 네트워크 확인, 업데이트, SSH 접속까지 되는지 순서대로 확인하는 것이 좋습니다. 여기까지 끝나면 웹서버나 데이터베이스 같은 실제 서비스를 올릴 준비가 된 상태입니다.",
    images: ["posts/tech-guides/almalinux-server.svg"],
    createdAt: "2026-07-04T02:00:00.000Z",
    readMinutes: 5,
    tags: ["AlmaLinux", "서버설치", "리눅스서버", "SSH"],
    searchIntent: "서버에 AlmaLinux를 설치하는 순서와 초기 설정 방법을 찾는 검색",
  },
  {
    id: "linux-install-guide",
    title: "리눅스 설치하는 법: USB 부팅부터 설치 후 확인까지",
    category: "컴퓨터",
    excerpt: "처음 리눅스를 설치하는 사람을 위해 ISO 다운로드, 부팅 USB 제작, 설치, 드라이버와 업데이트 확인 순서를 정리했습니다.",
    body:
      "리눅스를 처음 설치할 때 가장 헷갈리는 부분은 배포판 선택보다 설치 흐름입니다. 큰 흐름은 ISO 파일 다운로드, USB 제작, USB 부팅, 디스크 선택, 사용자 생성, 설치 후 업데이트입니다.\n\n먼저 설치할 배포판을 정합니다. 처음이라면 Ubuntu나 Linux Mint처럼 자료가 많은 배포판이 편합니다. 서버용이라면 AlmaLinux, Rocky Linux, Debian도 좋은 선택입니다. 배포판 공식 사이트에서 ISO 파일을 받고, 가능하면 체크섬을 확인해 파일이 정상인지 보는 것이 좋습니다.\n\n다음은 부팅 USB를 만드는 단계입니다. Windows에서는 Rufus나 balenaEtcher를 많이 사용합니다. USB를 선택하고 ISO 파일을 지정한 뒤 시작하면 됩니다. USB 안의 기존 자료는 지워질 수 있으니 꼭 백업해야 합니다.\n\n설치할 컴퓨터를 재부팅하고 F2, F12, Del 같은 키로 부팅 메뉴에 들어갑니다. 제조사마다 키가 다르지만 보통 전원을 켜자마자 여러 번 누르면 됩니다. 부팅 목록에서 USB를 선택하면 리눅스 설치 화면이 나옵니다.\n\n디스크 선택 단계에서는 가장 주의해야 합니다. 기존 Windows를 지우고 리눅스만 쓸 것인지, 듀얼부팅을 할 것인지 먼저 정해야 합니다. 중요한 자료가 있다면 설치 전에 외장하드나 클라우드에 백업하는 것이 안전합니다.\n\n설치가 끝나면 가장 먼저 업데이트를 진행합니다. Ubuntu 계열은 sudo apt update && sudo apt upgrade, Fedora 계열은 sudo dnf update를 사용합니다. 그래픽 드라이버, 와이파이, 블루투스, 한글 입력이 정상인지도 확인합니다.\n\n리눅스 설치는 어렵다기보다 실수하면 디스크를 지울 수 있어서 조심해야 하는 작업입니다. 처음에는 남는 노트북이나 가상머신에서 한 번 연습해보면 훨씬 편하게 익힐 수 있습니다.",
    images: ["posts/tech-guides/linux-install.svg"],
    createdAt: "2026-07-04T01:50:00.000Z",
    readMinutes: 5,
    tags: ["리눅스설치", "USB부팅", "Ubuntu", "Linux"],
    searchIntent: "리눅스를 처음 설치하는 방법과 USB 부팅 과정을 찾는 검색",
  },
  {
    id: "linux-distro-types",
    title: "리눅스 종류 정리: Ubuntu, Debian, Fedora, AlmaLinux 차이",
    category: "컴퓨터",
    excerpt: "리눅스 배포판이 왜 여러 개인지, Ubuntu와 Debian, Fedora, AlmaLinux, Arch가 어떤 용도에 맞는지 정리했습니다.",
    body:
      "리눅스는 하나의 운영체제처럼 보이지만 실제로는 여러 배포판으로 나뉩니다. 배포판은 리눅스 커널에 패키지 관리자, 기본 프로그램, 업데이트 정책, 설치 도구를 묶어 배포하는 형태입니다.\n\nUbuntu는 가장 대중적인 배포판 중 하나입니다. 설치가 쉽고 자료가 많아서 처음 리눅스를 쓰는 사람에게 좋습니다. 데스크톱, 개발 환경, 서버 모두에서 널리 쓰입니다.\n\nDebian은 안정성을 중요하게 보는 배포판입니다. 업데이트 속도는 빠르지 않을 수 있지만 검증된 패키지를 쓰기 때문에 서버나 장기 운영 환경에 잘 맞습니다. Ubuntu도 Debian을 기반으로 만들어졌습니다.\n\nFedora는 비교적 최신 기술을 빠르게 경험할 수 있는 배포판입니다. 새로운 GNOME 환경이나 최신 커널, 개발 도구를 써보고 싶은 사람에게 좋습니다. 다만 서버를 오래 안정적으로 운영하려는 목적이라면 업데이트 주기를 고려해야 합니다.\n\nAlmaLinux와 Rocky Linux는 RHEL 계열 서버 배포판입니다. 예전 CentOS를 쓰던 사람들이 많이 넘어간 선택지입니다. 기업 서버, 웹서버, 데이터베이스 서버처럼 안정성과 호환성을 중요하게 보는 환경에 잘 어울립니다.\n\nArch Linux는 직접 구성하는 재미가 있는 배포판입니다. 설치부터 설정까지 사용자가 많은 부분을 직접 선택합니다. 배우기에는 좋지만 처음 리눅스를 쓰는 사람에게는 난도가 높을 수 있습니다.\n\n정리하면 처음 배우는 용도는 Ubuntu, 안정적인 서버는 Debian이나 AlmaLinux, 최신 데스크톱 경험은 Fedora, 깊게 배우고 싶은 경우는 Arch가 어울립니다. 목적을 먼저 정하면 배포판 선택이 훨씬 쉬워집니다.",
    images: ["posts/tech-guides/linux-distros.svg"],
    createdAt: "2026-07-04T01:40:00.000Z",
    readMinutes: 4,
    tags: ["리눅스종류", "Ubuntu", "Debian", "Fedora", "AlmaLinux"],
    searchIntent: "리눅스 배포판 종류와 차이, 용도별 추천을 찾는 검색",
  },
  {
    id: "python-install-guide",
    title: "파이썬 설치하는 법: Windows에서 PATH까지 설정하기",
    category: "컴퓨터",
    excerpt: "Windows에서 Python을 설치하고 Add Python to PATH, 버전 확인, pip, 가상환경까지 확인하는 순서를 정리했습니다.",
    body:
      "파이썬을 처음 설치할 때 가장 중요한 것은 설치 화면에서 Add Python to PATH를 체크하는 것입니다. 이 옵션을 켜야 PowerShell이나 명령 프롬프트에서 python 명령을 바로 사용할 수 있습니다.\n\n먼저 python.org에 접속해 Windows용 최신 Python 설치 파일을 받습니다. 설치 파일을 실행하면 첫 화면 아래쪽에 Add python.exe to PATH 또는 Add Python to PATH 옵션이 보입니다. 이 체크박스를 켠 뒤 Install Now를 누르면 됩니다.\n\n설치가 끝나면 PowerShell을 열고 python --version을 입력합니다. 버전이 표시되면 정상 설치된 것입니다. 만약 명령을 찾을 수 없다고 나오면 PATH가 제대로 잡히지 않은 것이므로 설치 프로그램을 다시 실행해 Modify 또는 Repair로 PATH 옵션을 확인합니다.\n\n파이썬 패키지를 설치할 때는 pip를 사용합니다. 예를 들어 requests 패키지는 pip install requests로 설치할 수 있습니다. 프로젝트마다 패키지를 분리하고 싶다면 가상환경을 쓰는 것이 좋습니다.\n\n가상환경은 python -m venv .venv 명령으로 만들 수 있습니다. Windows PowerShell에서는 .venv\\Scripts\\Activate.ps1을 실행하면 가상환경이 켜집니다. 이후 설치하는 패키지는 해당 프로젝트 안에서만 관리됩니다.\n\n개발을 편하게 하려면 VS Code도 함께 설치하는 것이 좋습니다. Python 확장을 설치하면 코드 실행, 자동완성, 디버깅을 더 쉽게 사용할 수 있습니다.\n\n정리하면 설치 파일 다운로드, PATH 체크, 버전 확인, pip 확인, 가상환경 생성 순서로 진행하면 됩니다. 이 순서만 익혀도 파이썬 개발을 시작하는 데 필요한 기본 세팅은 충분합니다.",
    images: ["posts/tech-guides/python-install.svg"],
    createdAt: "2026-07-04T01:30:00.000Z",
    readMinutes: 4,
    tags: ["파이썬설치", "Python", "PATH", "pip", "가상환경"],
    searchIntent: "Windows에서 Python 설치, PATH 설정, pip와 가상환경 설정 방법을 찾는 검색",
  },
  {
    id: "roa-hiking-sella-sneakers",
    title: "로아 셀라 하이킹 스니커즈 (ROA Hiking Sella)",
    category: "리뷰",
    excerpt: "로아 하이킹 브랜드의 신제품 Sella 스니커즈를 박스, 소재, 착화감, 비브람솔, 카타리나 비교까지 사진과 함께 정리했습니다.",
    body:
      "안녕하세요 루이입니다\n\n이번에 포스팅 할 제품은 로아 하이킹 브랜드의 제품 \"Sella\" 스니커즈 입니다.\n이탈리아의 기반으로 둔 브랜드이며 산악용 제품을 일상생활에서도 편하게 입을수 있게끔 만든 브랜드입니다.\n\n요즘 유행하는 고프코어에 딱 어울리는 브랜드라고 생각이 드네요.\n\n셀라라는 라인이 이번에 로아에서 새로 나온 신발인데\n\n발매때 올리브 색상은 여성사이즈 제일 작은거말곤 다 품절이 된걸보면 인기가 생각보다 있는거 같습니다.\n\n상자는 이전 카타리나와 같은 박스이지만 크기는 살짝 작아졌습니다.\n\n이전과 다르게 비브람솔 종이가 한개가 아닌 3개로 늘어났고\n\n이 종이들을 묶어서 주는군요.\n\n셀라 스니커즈의 옆면 모습입니다.\n\n쉐잎의 느낌이 호카가 생각나는 하이킹화네요.\n\n카타리나는 내피들이 빵빵하게 되어있다면\n\n이 제품은 러닝화느낌마냥 얇게 되어있습니다.\n\n미드솔 부분, 밑창을 눌러보면 러닝화처럼 정말 쫀득하게 들어가고\n\n착화감도 러닝화처럼 통통 튀는 느낌도 나면서 카타리나보다 훨씬 편하더군요.\n\n셀라같은 경우 종이 슈트리가 이렇게 들어가 있습니다.\n\n제품이 얇아서 쉐잎을 잡아주려고 이렇게 넣은것 같네요.\n\n블랙색상의 경우는 뒷쪽은 찢어져 있는것도 있던데 복불복인가 봅니다ㅋㅋ\n\n신발끈은 하이킹화 스럽게 스카치 포인트가 들어가 있으며\n\n끝쪽 팁에는 ROA라고 적혀있네요.\n\n밑창은 이렇게 되어있으며 이전 등산용 신발들보다 접지력이 높게 제작되었네요.\n\n올리브 색상과 블랙 색상 비교샷 입니다.\n\n카타리나와 비교샷 입니다.\n\n이상 로아의 신제품 셀라 리뷰였습니다.",
    images: roaSellaImages,
    createdAt: "2024-10-13T03:00:00.000Z",
    readMinutes: 3,
    tags: ["ROA", "로아셀라", "하이킹스니커즈", "고프코어", "비브람솔"],
    searchIntent: "ROA Hiking Sella 스니커즈 구매 후기, 착화감, 비브람솔, 카타리나 비교를 찾는 검색",
  },
];
