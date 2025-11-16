# 설계 문서 검토 및 수정사항

## 검토 일자
2025년 11월 14일

## 검토 목적
Phase 1 구현 전 설계 문서의 모든 문제점 및 개선사항 파악 및 수정

---

## 주요 수정사항

### 중대한 문제 (구현 전 반드시 수정)

#### 1. 완전한 Prisma schema.prisma 파일 작성
**문제**: 설계 문서에만 존재, 실제 파일 미존재

**해결**:
- `prisma/schema.prisma`에 완전한 스키마 작성
- User, Category, Tag, PostTag, Setting 모델 추가
- Post 모델 확장 (author, category 관계, contentHtml, coverImage, publishedAt, viewCount)
- 모든 인덱스 및 관계 완성
- SQLite onDelete: Cascade, SetNull 설정

#### 2. 로그인 경로 통일
**문제**: 문서 간 로그인 경로 불일치
- 03-features-and-pages.md: `/admin/login`
- 05-authentication.md: `/auth/login`

**해결**: 모든 문서를 `/auth/login`으로 통일

#### 3. lib/utils.js 모델 파라미터 오류 수정
**문제**:
```javascript
// 잘못된 코드
while (await prisma[model].findUnique({ where: { slug: currentSlug } })) {
```
- prisma['post']는 동작하지 않음 (prisma.post만 가능)

**해결**:
```javascript
// 수정된 코드
const modelMap = {
  'post': prisma.post,
  'tag': prisma.tag,
  'category': prisma.category
}

const model = modelMap[modelName]
if (!model) {
  throw new Error(`Unknown model: ${modelName}`)
}

while (await model.findUnique({ where: { slug: currentSlug } })) {
```

#### 4. ESM 호환 SESSION_SECRET 생성 명령어
**문제**:
```bash
# 동작하지 않음 (ESM 프로젝트)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**해결**:
```bash
# 방법 1 (권장)
openssl rand -hex 32

# 방법 2
node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
```

#### 5. 비ASCII Slug 처리 문제
**문제**: URL에 비ASCII 문자가 포함될 경우 인코딩 문제 발생

**해결**:
```javascript
// 이전
.replace(/[^a-z0-9-\u1100-\u11FF\uAC00-\uD7A3]/g, '')  // Unicode 범위 포함 ❌

// 이후
.replace(/[^a-z0-9-]/g, '')  // ASCII만 허용, transliteration에 의존 ✅
```

#### 6. Feature-First 폴더 구조 수정
**문제**: `features/blog/` 폴더 잘못 설계
- `features/blog/@get/`는 `/blog` 경로가 됨 (잘못됨)

**해결**:
```
features/
├── @get/                 # 홈 (/) ✅
├── posts/[slug]/@get/    # /posts/:slug ✅
├── category/[slug]/@get/ # /category/:slug ✅
├── tag/[slug]/@get/      # /tag/:slug ✅
└── search/@get/          # /search ✅
```

---

### 중요한 개선사항

#### 7. bcryptjs로 변경
**이유**: `bcrypt`는 네이티브 모듈로 일부 환경(Windows, Alpine Linux)에서 설치 문제 발생

**변경**:
- `npm install bcrypt` → `npm install bcryptjs`
- `import bcrypt from 'bcrypt'` → `import bcrypt from 'bcryptjs'`

#### 8. Markdown 렌더링 단계 조정
**변경**:
- Phase 5 선택사항 → Phase 5 필수 기능
- `marked`, `isomorphic-dompurify` 라이브러리 사용
- `lib/markdown.js` 작성
- XSS 방지를 위한 DOMPurify sanitize 적용

#### 9. 403 에러 페이지 추가
**추가**: `views/errors/403.ejs` 템플릿

#### 10. 중복 인증 미들웨어 제거
**개선**:
- 전역 `loadCurrentUser` 미들웨어가 이미 `req.currentUser` 설정
- feature 레벨 step에서 DB 재조회 불필요

**이전**:
```javascript
// 중복 조회 ❌
export default async (ctx, req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }

  ctx.currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId }
  })
}
```

**이후**:
```javascript
// 효율적 ✅
export default async (ctx, req, res) => {
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }

  ctx.currentUser = req.currentUser  // 이미 존재
}
```

#### 11. 설치 확인 미들웨어 개선
**개선사항**:
- 정적 파일, /install 경로 예외 처리
- try-catch로 DB 연결 실패 처리

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

#### 12. 태그 처리 트랜잭션 추가
**개선**: 게시물 생성과 태그 생성을 하나의 트랜잭션으로 처리 (원자성 보장)

```javascript
const post = await prisma.$transaction(async (tx) => {
  const newPost = await tx.post.create({ /* ... */ })

  if (tags.length > 0) {
    for (const tagName of tags) {
      let tag = await tx.tag.findUnique({ where: { name: tagName } })
      if (!tag) {
        tag = await tx.tag.create({ /* ... */ })
      }
      await tx.postTag.create({ /* ... */ })
    }
  }

  return newPost
})
```

#### 13. SQLite Foreign Key 활성화
**추가**: `lib/prisma.js`에 Foreign Keys 활성화 코드 추가

```javascript
// Foreign Key 활성화 (CASCADE 제약조건 동작하도록)
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
```

---

## 수정된 파일 목록

### 새로 생성된 파일
1. ✅ `prisma/schema.prisma` - 완전한 데이터베이스 스키마
2. ✅ `docs/07-review-fixes.md` - 이 문서

### 수정된 문서
1. ✅ `docs/03-features-and-pages.md`
   - 로그인 경로 `/admin/login` → `/auth/login`
   - bcrypt → bcryptjs

2. ✅ `docs/04-feature-first-structure.md`
   - 폴더 구조 수정 (blog/ 폴더 제거)
   - 한글 slug 처리 수정
   - 경로 예제 업데이트

3. ✅ `docs/05-authentication.md`
   - ESM 호환 SESSION_SECRET 생성 명령어

4. ✅ `docs/06-implementation-roadmap.md`
   - bcryptjs로 변경
   - SESSION_SECRET 명령어 업데이트
   - lib/utils.js 모델 파라미터 수정
   - 한글 slug 처리 수정
   - 설치 확인 미들웨어 개선
   - 중복 인증 미들웨어 제거
   - 태그 처리 트랜잭션 추가
   - Phase 5에 markdown 렌더링 및 SQLite 설정 추가
   - 403 에러 페이지 추가
   - 예상 시간 업데이트

---

## 다음 단계

### 구현 준비 완료
모든 설계 문서 검토 및 수정 완료. Phase 1부터 구현 시작 가능.

### 권장 구현 순서
1. **Phase 1 (7시간)**: Prisma 마이그레이션 → 공통 라이브러리 → 설치 시스템
2. **Phase 2 (2시간)**: 로그인/로그아웃
3. **Phase 4.2 (3시간)**: 게시물 작성 (관리자가 먼저 게시물을 작성해야 테스트 가능)
4. **Phase 3 (4시간)**: 공개 블로그 (게시물 목록, 상세)
5. **Phase 5 (2시간)**: Markdown 렌더링, SQLite 설정
6. **Phase 4 나머지 (5시간)**: 대시보드, 게시물 목록/수정/삭제

### 첫 실행 명령어
```bash
# 1. 패키지 설치
npm install

# 2. Prisma 마이그레이션
npx prisma migrate dev --name add_blog_models

# 3. Prisma Studio로 확인
npx prisma studio

# 4. 개발 서버 실행
npm run dev
```

---

## 변경 통계

- **수정된 문서**: 4개 파일
- **새로 생성된 파일**: 2개 파일
- **수정된 코드 블록**: 15개 블록
- **추가된 기능**: 3개 (markdown, SQLite FK, transactions)
- **제거된 문제**: 13개 문제

---

## 검토자 노트

### 설계의 강점
1. Feature-First 아키텍처의 효과적인 활용
2. 철저한 보안 고려사항 (bcryptjs, XSS 방지, CSRF)
3. 명확한 단계별 구현
4. UUID 사용으로 보안성 향상

### 구현 시 주의사항
1. 마이그레이션 전 기존 데이터 백업 필수
2. 설치 시 DB가 없어도 오류 처리 필요
3. 프로덕션 배포 전 개발 환경에서 철저히 테스트
4. SESSION_SECRET는 반드시 강력한 랜덤 값 사용

### 향후 고려사항
1. 이미지 업로드 기능 (multer)
2. SEO 최적화 (meta 태그, sitemap.xml, robots.txt)
3. RSS 피드 생성
4. 게시물 작성 중 자동 저장
5. 댓글 시스템 (선택)
