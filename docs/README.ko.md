<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>카멜레온 AI 어시스턴트</h1>
  <p>
    <strong>최첨단 AI를 활용하여 코딩과 창의적 워크플로우를 혁신하세요. 오픈소스, 확장 가능한 로컬 AI 워크스테이션.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 카멜레온이란?

카멜레온은 단순한 AI 채팅 창이 아닙니다. VS Code를 전문가급 로컬 퍼스트 AI 기반 노트북으로 변환하는 강력한 오픈소스 VS Code 확장 프로그램입니다.

개발자, 작가, 연구자를 위해 설계된 카멜레온은 AI의 제어권을 당신에게 돌려줍니다. 워크플로우에 깊이 통합되어 OpenAI, Google Gemini, DeepSeek 등 모든 서드파티 AI 제공업체에 원활하게 연결하고, 로컬 및 클라우드 모델을 관리하며, VS Code의 친숙한 환경에서 완전히 당신만의 프라이빗 AI 툴체인을 구축할 수 있습니다.

## ✨ 핵심 기능

* **🎯 6개 AI 엔진, 20+ 선별된 모델**: 벤더 락인에서 해방! OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama 등 6개 주요 AI 엔진을 지원하며, 최신 GPT-4o, Claude 3.5 Sonnet, DeepSeek V3 등 20+ 선별된 모델을 커버합니다.
* **🧠 5가지 전용 모델 설정**: 단문, 장문, 사고, 이미지, 비디오 5가지 전용 모델을 지능적으로 설정하여 각 작업에 가장 적합한 AI 모델을 사용합니다.
* **🎨 멀티모달 AI 지원**: 텍스트 대화뿐만 아니라 이미지 이해, 비디오 분석, OCR 인식 등 멀티미디어 AI 기능을 지원합니다.
* **⚡ 지능형 모델 라우팅**: 작업 복잡도, 콘텐츠 길이, 모달리티 타입에 따라 최적의 모델을 자동 선택하여 성능과 비용의 완벽한 균형을 실현합니다.
* **📓 전문가급 노트북 인터페이스**: 단순한 Q&A를 넘어서세요. AI 기반 작업을 리치 텍스트 노트북으로 구성하여 Markdown, 코드 스니펫, AI 프롬프트를 완벽하게 융합합니다.
* **🔒 프라이버시 퍼스트 설계**: 로컬 모델 실행을 지원하여 데이터 보안을 완전히 제어하면서 클라우드 API의 편의성도 제공합니다.
* **🎛️ 깊은 IDE 통합**: VS Code의 네이티브 기능처럼 느껴집니다. 우클릭 메뉴, 코드 렌즈, 전용 사이드바 패널에서 언제든지 강력한 AI 도구에 접근하세요.
* **🌍 12개 언어 지원**: 중국어, 영어, 일본어, 독일어, 프랑스어, 스페인어, 포르투갈어, 베트남어, 힌디어, 한국어, 러시아어, 아랍어의 완전한 국제화 경험.

## 🚀 설치 방법

필요에 가장 적합한 설치 방법을 선택하세요:

### 📦 방법 1: VS Code Marketplace (권장)

**Chameleon을 설치하는 가장 쉬운 방법 - 대부분의 사용자에게 완벽합니다.**

1. **확장 설치:**
   - Visual Studio Code 열기
   - 확장 보기로 이동 (`Ctrl+Shift+X` 또는 `Cmd+Shift+X`)
   - **"chameleon-ai-launcher"** 검색
   - "설치" 클릭

2. **종속성 설치:**
   - 설치 후 명령 팔레트 열기 (`Ctrl+Shift+P` 또는 `Cmd+Shift+P`)
   - `Chameleon: Open Installation Guide` 명령 실행
   - Node.js, Git, Claude Code, Gemini CLI 설치를 위한 단계별 지침 따르기

3. **구성 및 시작:**
   - `Chameleon: Open AI Settings`를 실행하여 AI 공급자 구성
   - 활동 표시줄의 Chameleon 아이콘을 클릭하여 시작!

### 📁 방법 2: 사전 빌드된 VSIX 패키지

**확장 패키지 파일에서 직접 설치.**

1. **VSIX 다운로드:**
   - [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)로 이동
   - 최신 `chameleon-ai-launcher-x.x.x.vsix` 파일 다운로드

2. **VS Code를 통해 설치:**
   ```bash
   # 방법 A: 명령줄
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 방법 B: VS Code UI
   # 1. VS Code 열기
   # 2. 확장 보기로 이동 (Ctrl+Shift+X)
   # 3. "..." 메뉴 클릭 → "VSIX에서 설치..."
   # 4. 다운로드한 .vsix 파일 선택
   ```

3. **설정 완료:**
   - 방법 1과 동일한 종속성 설치 및 구성 단계 따르기

### 🛠️ 방법 3: 소스 코드에서 빌드

**확장에 기여하거나 사용자 정의하려는 개발자용.**

**전제 조건:**
- Git
- Node.js (v16 이상)
- npm 또는 yarn

**단계:**

1. **복제 및 빌드:**
   ```bash
   # 저장소 복제
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # 종속성 설치
   npm install
   
   # 확장 컴파일
   npm run compile
   
   # 확장 패키지화 (선택사항)
   npm install -g @vscode/vsce
   vsce package
   ```

2. **개발용 설치:**
   ```bash
   # 방법 A: 패키지된 버전 설치
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 방법 B: 개발 모드에서 실행
   # VS Code에서 프로젝트를 열고 F5를 눌러 확장 개발 호스트 시작
   ```

3. **종속성 설치:**
   - 설치 가이드에 설명된 대로 Node.js, Git, Claude Code, Gemini CLI 설치
   - 확장 설정을 통해 AI 공급자 구성

---

## ⚙️ 설치 후 설정

**설치 방법에 관계없이 다음 단계를 완료하세요:**

1. **Multi-CLI 종속성 설치:**
   - Node.js 및 npm
   - Git
   - Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
   - Gemini CLI 패키지

2. **AI 공급자 구성:**
   - 명령 팔레트를 열고 `Chameleon: Open AI Settings` 실행
   - OpenAI, Anthropic, Google 또는 기타 공급자의 API 키 추가

3. **설치 확인:**
   - VS Code 활동 표시줄의 Chameleon 아이콘 클릭
   - Claude Code 및 Gemini CLI 페이지 탐색
   - 모든 종속성이 "설치됨"으로 표시되는지 확인

**도움이 필요하신가요?** 자세한 단계별 지침은 `Chameleon: Open Installation Guide`를 실행하세요!

1. 명령 팔레트를 엽니다 (`Ctrl+Shift+P`).
2. `Chameleon: AI 설정 열기` 명령을 실행합니다.
3. 사용하고 싶은 AI 제공업체를 선택하고 API 키를 입력합니다.
4. 설정 완료! VS Code 활동 표시줄의 카멜레온 아이콘을 클릭하여 시작합니다.

### 경로 2: 개발자 (소스 코드에서 실행)

소스 코드에서 실행, 수정하거나 코드에 기여하고 싶다면 이 경로를 따르세요.

**전제 조건:**
* Git이 설치되어 있어야 합니다.
* Node.js가 설치되어 있어야 합니다 (v16 이상 권장).
* **설치 가이드**에 따라 `Claude Code`, `Claude Code Router` 등 종속성의 설치와 설정이 완료되어 있어야 합니다.

**작업 단계:**

1. **저장소 클론:**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **프로젝트 종속성 설치:**
   ```bash
   npm install
   ```

3. **코드 컴파일:**
   * 한 번 컴파일: `npm run compile`
   * 파일 변경 사항 감시 및 자동 컴파일: `npm run watch`

4. **확장 프로그램 실행:**
   * VS Code에서 이 프로젝트 폴더를 엽니다.
   * `F5` 키를 누르면 "확장 개발 호스트"의 새 창이 시작되어 카멜레온 확장 프로그램이 해당 창에서 실행됩니다.

## 🎯 지원되는 AI 엔진 및 모델

카멜레온은 Claude Code Router를 통해 **6개 주요 AI 엔진**을 지원하며, 전문가급 AI 기능을 위한 **20+ 선별된 모델**을 커버합니다:

### 🔥 텍스트 AI 엔진

#### **OpenRouter**
- **Claude 3.5 Sonnet**: 가장 강력한 추론 능력
- **Claude 3 Haiku**: 빠르고 가벼운 버전
- **GPT-4o**: 최신 멀티모달 모델
- **GPT-4o-mini**: 가벼운 버전, 비용 대비 성능 우수
- **Llama 3.1 405B**: 오픈소스 대형 모델
- **Gemini Pro 1.5**: 긴 컨텍스트 전문가

#### **DeepSeek**
- **DeepSeek Chat**: 일반 대화 모델
- **DeepSeek Coder**: 전문 코드 생성

#### **Google Gemini**
- **Gemini Pro**: 일반 추론 모델
- **Gemini Pro Vision**: 이미지 이해 모델

#### **Volcengine**
- **DeepSeek V3**: Volcengine 버전 (128K 토큰 긴 컨텍스트)

#### **Azure OpenAI**
- **GPT-4**: 클래식 고급 추론 모델
- **GPT-4 Turbo**: 고성능 추론 모델
- **GPT-3.5 Turbo**: 빠른 응답 모델

#### **Ollama** (로컬 배포)
- **Llama 3.1**: 오픈소스 대화 모델
- **CodeLlama**: 코드 전문 모델
- **Mistral**: 효율적인 추론 모델
- **Gemma**: 가벼운 모델

### 🎨 멀티모달 AI 엔진

#### **이미지 이해 엔진 - Seedream**
- 전문적인 이미지 분석, OCR 인식, 차트 이해
- 여러 이미지 형식과 복잡한 시각적 작업 지원

#### **비디오 처리 엔진 - Seedance**
- 전문적인 비디오 콘텐츠 분석 및 요약 생성
- 긴 비디오 이해와 액션 인식 지원

### ⚙️ 지능형 모델 설정

카멜레온은 **5가지 전용 모델 설정**을 지원하여 다양한 시나리오에 가장 적합한 AI 모델을 선택할 수 있습니다:

#### **1. 단문 모델** (빠른 응답)
- 적용: 간단한 Q&A, 코드 완성, 빠른 번역
- 권장: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. 장문 모델** (큰 컨텍스트)
- 적용: 긴 문서 분석, 코드 리뷰, 복잡한 추론
- 권장: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. 사고 모델** (깊은 추론)
- 적용: 복잡한 문제 해결, 아키텍처 설계, 수학 계산
- 권장: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. 이미지 모델** (시각적 이해)
- 적용: 이미지 분석, OCR, 차트 이해
- 권장: Seedream 엔진

#### **5. 비디오 모델** (비디오 처리)
- 적용: 비디오 요약, 콘텐츠 분석, 액션 인식
- 권장: Seedance 엔진

### 🚀 모델 라우팅 전략

카멜레온의 지능형 라우팅 시스템은 다음 조건에 따라 최적의 모델을 자동 선택합니다:

- **작업 복잡도**: 간단한 작업 → 빠른 모델, 복잡한 작업 → 추론 모델
- **콘텐츠 길이**: 짧은 텍스트 → 가벼운 모델, 긴 문서 → 큰 컨텍스트 모델
- **모달리티 타입**: 텍스트 → 언어 모델, 이미지 → Seedream 엔진, 비디오 → Seedance 엔진
- **사용자 설정**: 특정 모델의 수동 지정
- **비용 최적화**: 성능과 비용의 완벽한 균형

## 🏗️ 아키텍처

### 컴포넌트
```
카멜레온 확장 프로그램
├── 환영 패널          # 입문 인터페이스
├── 설정 패널          # AI 제공업체 설정
├── 채팅 패널          # AI 대화 인터페이스
├── 설치 가이드 패널   # 설치 설명
├── 시스템 설정 패널   # 언어 및 테마 설정
└── Claude 클라이언트  # AI 모델 통합
```

### 파일 구조
```
chameleon/
├── src/
│   ├── extension.ts           # 메인 확장 진입점
│   ├── webviews/              # UI 패널
│   │   ├── settingsPanel.ts   # AI 설정
│   │   ├── chatPanel.ts       # 채팅 인터페이스
│   │   ├── installGuidePanel.ts # 설치 가이드
│   │   └── systemSettingsPanel.ts # 시스템 설정
│   └── utils/                 # 유틸리티 함수
│       ├── i18n.ts           # 국제화
│       └── claudeClient.ts   # AI 클라이언트
├── l10n/                     # 번역 파일
├── package.json              # 확장 매니페스트
└── README.md                 # 이 파일
```

## 🌍 국제화

카멜레온은 12개 언어를 지원합니다:
- English (en)
- 简体中文 (zh)
- 日本語 (ja)
- Deutsch (de)
- Français (fr)
- Español (es)
- Português (pt)
- Tiếng Việt (vi)
- हिन्दी (hi)
- 한국어 (ko)
- Русский (ru)
- العربية (ar)

## 🏪 AGTHub - AI 에이전트 마켓플레이스

**[AGTHub](https://www.agthub.org)**는 Chameleon의 공식 AI 에이전트 마켓플레이스로, AI 에이전트를 발견하고 공유하며 관리할 수 있는 포괄적인 플랫폼을 제공합니다.

### 🌟 주요 기능

- **🔍 광범위한 에이전트 라이브러리**: 여러 카테고리에 걸쳐 수백 개의 무료 및 프리미엄 AI 에이전트 탐색
- **📤 간편한 게시**: 웹 또는 CLI를 통해 전 세계 커뮤니티와 사용자 정의 에이전트 공유
- **💰 수익 창출**: 프리미엄 에이전트를 판매하고 AI 에이전트 비즈니스 구축
- **⭐ 커뮤니티 평가**: 커뮤니티 리뷰 및 평점을 통해 최고의 에이전트 발견
- **🌐 다국어 지원**: 영어, 중국어 간체, 일본어, 베트남어 완벽 지원
- **🚀 직접 통합**: AGTHub에서 Chameleon으로 원클릭 에이전트 설치

### 🎯 Chameleon 사용자를 위한

AGTHub는 Chameleon의 에이전트 마켓플레이스와 완벽하게 통합됩니다:

1. **탐색 및 발견**: [www.agthub.org](https://www.agthub.org) 또는 Chameleon 내에서 직접 에이전트 탐색
2. **원클릭 설치**: Chameleon의 마켓플레이스 패널을 통해 무료 에이전트 즉시 설치
3. **프리미엄 액세스**: AGTHub에서 프리미엄 에이전트 구매하여 고급 기능 이용
4. **최신 정보 유지**: 에이전트 업데이트 및 신규 릴리스에 대한 자동 알림 수신

### 🛠️ 에이전트 개발자를 위한

커뮤니티와 에이전트 생성 및 공유:

- **웹 게시**: 직관적인 [AGTHub 대시보드](https://www.agthub.org/dashboard)를 사용하여 에이전트 게시
- **CLI 게시**: `agt publish`를 사용하여 명령줄을 통해 게시 ([@chameleon-nexus/agents-cli](https://www.npmjs.com/package/@chameleon-nexus/agents-cli) 필요)
- **버전 관리**: 에이전트 쉽게 업데이트 - 새 버전이 자동으로 이전 버전 대체
- **분석**: 에이전트의 다운로드 수, 평점, 사용자 피드백 추적
- **프리미엄 옵션**: 프리미엄 에이전트를 제공하여 작업 수익화

### 💼 기업을 위한

기업 팀을 위한 특별 기능:

- **기업 로그인**: 조직 계정을 위한 전용 인증
- **무료 프리미엄 액세스**: 기업 사용자는 모든 유료 에이전트에 무료로 액세스
- **대량 관리**: 전체 팀에서 효율적으로 에이전트 관리
- **비공개 게시**: 조직 내에서 내부적으로 에이전트 공유

### 🔗 빠른 링크

- **AGTHub 웹사이트**: [https://www.agthub.org](https://www.agthub.org)
- **무료 에이전트**: [무료 에이전트 탐색](https://www.agthub.org)
- **프리미엄 에이전트**: [프리미엄 섹션 탐색](https://www.agthub.org/paid)
- **개발자 대시보드**: [에이전트 게시](https://www.agthub.org/dashboard)
- **CLI 도구**: [npm의 Agents CLI](https://www.npmjs.com/package/@chameleon-nexus/agents-cli)

> **💡 전문가 팁**: Chameleon의 내장 마켓플레이스는 빠른 탐색에 완벽하지만, 상세한 에이전트 설명, 리뷰, 고급 검색 필터가 포함된 전체 경험을 위해 [AGTHub](https://www.agthub.org)를 방문하세요!

## 🔧 문제 해결

### 일반적인 문제

1. **확장 프로그램이 활성화되지 않음**:
   - VS Code 개발자 콘솔 확인 (도움말 > 개발자 도구 전환)
   - 확장 프로그램이 활성화되어 있는지 확인
   - 충돌하는 확장 프로그램이 없는지 확인

2. **AI 제공업체 연결 문제**:
   - API 키가 올바르게 설정되어 있는지 확인
   - 네트워크 연결 확인
   - API 타임아웃 설정 확인
   - 내장된 연결 테스트 기능 사용

3. **설치 가이드가 작동하지 않음**:
   - 관리자 권한이 있는지 확인 (Windows)
   - Node.js와 Git이 올바르게 설치되어 있는지 확인
   - 가이드의 단계에 따라 수동 설치 시도

### 디버그 모드

디버그 로깅 활성화:
1. VS Code 설정 열기
2. "chameleon.debug" 검색
3. 디버그 모드 활성화
4. 출력 패널에서 "Chameleon" 로그 확인

## 🤝 기여

카멜레온은 커뮤니티를 위해 구축된 오픈소스 프로젝트입니다. 모든 형태의 기여를 환영합니다! 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참조하세요.

### 개발 설정

1. 저장소 포크
2. 기능 브랜치 생성
3. 변경사항 적용
4. 해당하는 경우 테스트 추가
5. 풀 리퀘스트 제출

## 📄 오픈소스 라이선스

이 프로젝트는 MIT 라이선스 하에 오픈소스입니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

- **문제 보고**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **토론**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **문서**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 변경 로그

### v0.1.0 (초기 릴리스)
- 범용 AI 제공업체 지원
- 전문가급 노트북 인터페이스
- 깊은 IDE 통합
- 프라이버시 퍼스트 설계
- 완전한 국제화 (12개 언어)
- 포괄적인 설치 가이드

---

**개발자 커뮤니티를 위해 ❤️로 만들어졌습니다**
