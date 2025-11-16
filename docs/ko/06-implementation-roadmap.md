# 구현 로드맵

## 구현 원칙

1. **상향식 접근**: 기반 시스템부터 구축
2. **단계별 테스트**: 각 Phase 완료 후 테스트
3. **점진적 기능 추가**: 핵심 → 추가 기능 순서
4. **데이터 무결성 우선**: 철저한 마이그레이션 전략

## Phase 1: 기반 시스템 (7시간)

### 목표
- 데이터베이스 스키마 완성
- 공통 라이브러리 구현
- 설치 시스템 완성

### 작업 목록

#### 1.1 Prisma 스키마 확장 및 마이그레이션 (1시간)
**작업:**
1. `prisma/schema.prisma` 업데이트
   - User, Category, Tag, PostTag, Setting 모델 추가
   - Post 모델 확장 (author, category 관계 추가)
   - 인덱스 최적화

2. 마이그레이션 실행
   ```bash
   npx prisma migrate dev --name add_blog_models
   ```

3. 시드 데이터 업데이트
   - `prisma/seed.js` 수정
   - 기본 카테고리 3개 추가
   - 설치 플래그 추가

**검증:**
```bash
npx prisma studio
# 모든 테이블이 생성되었는지 확인
```

#### 1.2 공통 라이브러리 작성 (2시간)
**파일 목록:**
- `lib/auth.js`: 비밀번호 해싱/검증
- `lib/middleware.js`: 인증/인가 미들웨어
- `lib/validators.js`: 유효성 검증 함수
- `lib/utils.js`: 유틸리티 함수 (slug 생성 등)

**lib/auth.js**
```javascript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
```

#### 1.3 세션 설정 (30분)
**작업:**
1. 패키지 설치
   ```bash
   npm install express-session bcryptjs
   ```
   > 참고: `bcryptjs`는 순수 JavaScript 구현으로 모든 플랫폼에서 안정적으로 동작

2. app.js에 세션 미들웨어 추가

3. .env에 SESSION_SECRET 추가
   ```bash
   openssl rand -hex 32
   # 또는
   node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
   ```

#### 1.4 설치 기능 구현 (3시간)
**폴더 구조:**
```
features/
└── install/
    ├── @get/
    │   └── steps/
    │       ├── 100-check-installed.js
    │       └── 200-render-form.js
    └── @post/
        └── steps/
            ├── 100-validate.js
            ├── 200-create-admin.js
            ├── 300-init-settings.js
            └── 400-finish.js
```

#### 1.5 설치 확인 미들웨어 (30분)
app.js의 feature 등록 전에 추가:
```javascript
app.use(async (req, res, next) => {
  // 정적 파일과 /install 경로는 체크 제외
  if (req.path.startsWith('/public') || req.path.startsWith('/install')) {
    return next()
  }

  try {
    const installed = await prisma.setting.findUnique({
      where: { key: 'installed' }
    })

    if (!installed || installed.value !== 'true') {
      return res.redirect('/install')
    }

    next()
  } catch (error) {
    console.error('설치 확인 오류:', error)
    return res.redirect('/install')
  }
})
```

**Phase 1 체크리스트:**
- [ ] Prisma 스키마 확장 완료
- [ ] 마이그레이션 성공
- [ ] lib/ 공통 라이브러리 작성
- [ ] 세션 설정 완료
- [ ] 설치 기능 동작
- [ ] 설치 확인 미들웨어 동작

---

## Phase 2: 인증 시스템 (2시간)

### 목표
- 로그인/로그아웃 기능
- 세션 관리
- 관리자 권한 확인

### 작업 목록

#### 2.1 로그인 기능 (2시간)
**폴더 구조:**
```
features/
└── auth/
    ├── login/
    │   ├── @get/
    │   │   └── steps/
    │   │       └── 100-render.js
    │   └── @post/
    │       └── steps/
    │           ├── 100-validate.js
    │           ├── 200-authenticate.js
    │           └── 300-create-session.js
    └── logout/
        └── @post/
            └── steps/
                └── 100-destroy-session.js
```

**Phase 2 체크리스트:**
- [ ] 로그인 기능 동작
- [ ] 로그아웃 기능 동작
- [ ] 세션 유지 확인
- [ ] 잘못된 자격증명 처리
- [ ] 비활성 계정 차단

---

## Phase 3: 공개 블로그 기능 (4시간)

### 목표
- 발행된 게시물 목록 표시
- 게시물 상세 보기
- 카테고리/태그별 보기

### 작업 목록

#### 3.1 홈 (게시물 목록) 기능 확장 (2시간)
**주요 구현:**
- 페이지네이션 지원
- 작성자, 카테고리, 태그 포함
- 발행일 기준 정렬

#### 3.2 게시물 상세 보기 (2시간)
**기능:**
- Markdown 렌더링
- 조회수 증가
- 작성자 정보
- 관련 게시물

**Phase 3 체크리스트:**
- [ ] 홈 페이지에 게시물 목록 표시
- [ ] 페이지네이션 동작
- [ ] 게시물 상세 보기 동작
- [ ] 조회수 증가
- [ ] 404 에러 페이지 표시

---

## Phase 4: 관리자 기능 (8시간)

### 목표
- 관리자 대시보드
- 게시물 작성/수정/삭제
- 카테고리/태그 관리

### 작업 목록

#### 4.1 관리자 대시보드 (2시간)
**기능:**
- 통계 (총 게시물, 발행, 조회수)
- 최근 게시물 목록
- 빠른 작업 링크

#### 4.2 게시물 작성 기능 (3시간)
**기능:**
- Markdown 에디터
- 카테고리/태그 선택
- 발행/임시저장 토글
- 자동 태그 생성
- 트랜잭션 기반 처리

#### 4.3 게시물 목록 기능 (1시간)
**기능:**
- 전체 게시물 (발행/미발행)
- 검색/필터링
- 삭제 기능

#### 4.4 게시물 수정/삭제 기능 (2시간)
**기능:**
- 기존 게시물 로드
- 작성과 동일한 인터페이스
- 확인 후 안전한 삭제

**Phase 4 체크리스트:**
- [ ] 관리자 대시보드 동작
- [ ] 통계 표시
- [ ] 게시물 작성 동작
- [ ] 자동 태그 생성 확인
- [ ] 게시물 목록 표시
- [ ] 게시물 수정 동작
- [ ] 게시물 삭제 동작

---

## Phase 5: 고급 기능 (2시간)

### 5.1 Markdown 렌더링 (필수 - 1시간)
```bash
npm install marked isomorphic-dompurify
```

**lib/markdown.js:**
```javascript
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

export function renderMarkdown(markdown) {
  if (!markdown) return ''
  const rawHtml = marked(markdown)
  const cleanHtml = DOMPurify.sanitize(rawHtml)
  return cleanHtml
}
```

### 5.2 SQLite Foreign Key 활성화 (필수)
**lib/prisma.js 업데이트:**
```javascript
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
```

### 5.3 카테고리/태그별 보기 (선택)
### 5.4 검색 기능 (선택)

---

## 데이터베이스 마이그레이션 전략

### 현재 상태
- Post, Feature, TechStack 모델 존재

### 확장 계획
1. **1차 마이그레이션**: User, Setting 추가
2. **2차 마이그레이션**: Category, Tag, PostTag 추가
3. **3차 마이그레이션**: Post 모델 확장 (author, category 관계)

### 마이그레이션 명령어
```bash
# 개발 환경
npx prisma migrate dev --name migration_name

# 프로덕션 환경
npx prisma migrate deploy
```

---

## 테스트 전략

### 단계별 테스트

**Phase 1:**
- [ ] 설치 프로세스 완료
- [ ] 관리자 계정 생성
- [ ] 기본 설정 저장
- [ ] 설치 후 리다이렉트 동작

**Phase 2:**
- [ ] 로그인 성공/실패 케이스
- [ ] 세션 유지 확인
- [ ] 로그아웃 동작
- [ ] 권한 없는 접근 차단

**Phase 3:**
- [ ] 발행된 게시물만 표시
- [ ] 페이지네이션 동작
- [ ] 게시물 상세 보기
- [ ] 조회수 증가

**Phase 4:**
- [ ] 관리자 대시보드 통계
- [ ] 게시물 작성/수정/삭제
- [ ] 자동 태그 생성
- [ ] Slug 중복 방지

---

## 배포 체크리스트

### 환경 설정
- [ ] .env 파일에 프로덕션 값 설정
- [ ] SESSION_SECRET 생성
- [ ] NODE_ENV=production 설정

### 데이터베이스
- [ ] 프로덕션 마이그레이션 실행
- [ ] 백업 전략 수립

### 보안
- [ ] HTTPS 설정
- [ ] 보안 쿠키 활성화
- [ ] 비밀번호 정책 적용
- [ ] CSRF 토큰 (선택)

### 성능
- [ ] 정적 파일 캐싱
- [ ] 데이터베이스 인덱스 확인
- [ ] N+1 쿼리 최적화

---

## 예상 총 소요시간

| Phase | 시간 | 비고 |
|-------|------|-------|
| Phase 1: 기반 시스템 | 7시간 | Prisma, 공통 라이브러리, 설치 |
| Phase 2: 인증 | 2시간 | 로그인/로그아웃 |
| Phase 3: 공개 블로그 | 4시간 | 게시물 목록, 상세 보기 |
| Phase 4: 관리자 | 8시간 | 대시보드, 게시물 CRUD |
| Phase 5: 고급 (필수) | 2시간 | Markdown, SQLite 설정 |
| **총 (MVP)** | **23시간** | 카테고리/태그/검색 제외 |
| **총 (전체)** | **25-27시간** | 모든 기능 포함 |

---

## 우선순위 권장사항

### 최소 기능 (MVP)
1. Phase 1: 설치 시스템
2. Phase 2: 인증 시스템
3. Phase 4.2: 게시물 작성
4. Phase 3: 공개 블로그

### 완성도 향상
1. Phase 4.1, 4.3, 4.4: 관리자 기능 완성
2. 카테고리/태그별 보기
3. 검색 기능

### 추가 개선사항
1. Markdown 렌더링
2. 이미지 업로드
3. SEO 최적화
4. RSS 피드

---

## 다음 단계

설계 완료! 다음 중 하나를 선택하세요:

1. **Phase 1부터 구현 시작**
2. **설계 문서 검토 및 수정**
3. **추가 기능 논의**

---

## 주요 구현 파일

상세한 코드 예제는 다음을 참조하세요:
- 한글 원문: 전체 코드 템플릿, EJS 뷰, 단계별 구현
- 이 요약본: 핵심 구조 및 주요 패턴

다른 문서 파일 참조:
- 01-overview.md: 시스템 아키텍처
- 02-database-schema.md: 데이터베이스 설계
- 03-features-and-pages.md: 기능 명세
- 04-feature-first-structure.md: 코드 패턴
- 05-authentication.md: 보안 구현
- 07-review-fixes.md: 설계 수정사항
