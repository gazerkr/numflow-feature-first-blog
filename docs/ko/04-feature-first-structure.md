# Feature-First 구조 설계

## 전체 구조

```
features/
├── install/              # 설치 기능
│   ├── @get/
│   │   └── steps/
│   │       ├── 100-check-installed.js
│   │       └── 200-render-form.js
│   └── @post/
│       └── steps/
│           ├── 100-validate.js
│           ├── 200-create-admin.js
│           ├── 300-init-settings.js
│           └── 400-finish.js
│
├── auth/                 # 인증 기능
│   ├── login/
│   │   ├── @get/
│   │   │   └── steps/
│   │   │       └── 100-render.js
│   │   └── @post/
│   │       └── steps/
│   │           ├── 100-validate.js
│   │           ├── 200-authenticate.js
│   │           └── 300-create-session.js
│   └── logout/
│       └── @post/
│           └── steps/
│               └── 100-destroy-session.js
│
├── @get/                 # 홈 (게시물 목록) - path: /
│   └── steps/
│       ├── 100-fetch-posts.js
│       ├── 200-render.js
│
├── posts/                # 게시물 상세 보기
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-post.js
│               ├── 200-increase-view.js
│               └── 300-render.js
│
├── category/             # 카테고리별 보기
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-category.js
│               ├── 200-fetch-posts.js
│               └── 300-render.js
│
├── tag/                  # 태그별 보기
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-tag.js
│               ├── 200-fetch-posts.js
│               └── 300-render.js
│
├── search/               # 검색
│   └── @get/
│       └── steps/
│           ├── 100-parse-query.js
│           ├── 200-search.js
│           └── 300-render.js
│
└── admin/                # 관리자 기능
    ├── @get/            # 대시보드
    │   └── steps/
    │       ├── 100-check-auth.js
    │       ├── 200-fetch-stats.js
    │       ├── 300-fetch-recent.js
    │       └── 400-render.js
    ├── posts/
    │   ├── @get/        # 게시물 목록
    │   │   └── steps/
    │   │       ├── 100-check-auth.js
    │   │       ├── 200-fetch-posts.js
    │   │       └── 300-render.js
    │   ├── new/
    │   │   ├── @get/    # 작성 폼
    │   │   │   └── steps/
    │   │   │       ├── 100-check-auth.js
    │   │   │       ├── 200-fetch-options.js
    │   │   │       └── 300-render.js
    │   │   └── @post/   # 작성 처리
    │   │       └── steps/
    │   │           ├── 100-check-auth.js
    │   │           ├── 200-validate.js
    │   │           ├── 300-generate-slug.js
    │   │           ├── 400-create-post.js
    │   │           └── 500-redirect.js
    │   └── [id]/
    │       ├── edit/
    │       │   ├── @get/
    │       │   │   └── steps/
    │       │   │       ├── 100-check-auth.js
    │       │   │       ├── 200-fetch-post.js
    │       │   │       └── 300-render.js
    │       │   └── @post/
    │       │       └── steps/
    │       │           ├── 100-check-auth.js
    │       │           ├── 200-validate.js
    │       │           ├── 300-update-post.js
    │       │           └── 400-redirect.js
    │       └── delete/
    │           └── @post/
    │               └── steps/
    │                   ├── 100-check-auth.js
    │                   ├── 200-delete-post.js
    │                   └── 300-redirect.js
    ├── categories/
    │   ├── @get/        # 카테고리 목록
    │   └── @post/       # 카테고리 생성
    ├── tags/
    │   ├── @get/        # 태그 목록
    │   └── @post/       # 태그 생성
    └── settings/
        ├── @get/        # 설정 화면
        └── @post/       # 설정 저장
```

## 주요 패턴

### 1. 인증 확인 패턴

모든 `/admin/*` 경로의 첫 번째 단계:

```javascript
// features/admin/.../steps/100-check-auth.js
export default async (ctx, req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }

  // 사용자 정보 가져오기
  ctx.currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId }
  })

  if (!ctx.currentUser || !ctx.currentUser.isActive) {
    req.session.destroy()
    return res.redirect('/auth/login')
  }
}
```

### 2. 데이터 조회 패턴

```javascript
// features/posts/[slug]/@get/steps/100-fetch-post.js
import { prisma } from '../../../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { slug } = req.params

  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: {
        select: { displayName: true }
      },
      category: true,
      tags: {
        include: { tag: true }
      }
    }
  })

  if (!post) {
    return res.status(404).render('errors/404', {
      message: '게시물을 찾을 수 없습니다.'
    })
  }

  ctx.post = post
}
```

### 3. 유효성 검증 패턴

```javascript
// features/admin/posts/new/@post/steps/200-validate.js
export default async (ctx, req, res) => {
  const { title, content, categoryId } = req.body
  const errors = []

  if (!title || title.trim().length === 0) {
    errors.push('제목을 입력해주세요.')
  }

  if (!content || content.trim().length === 0) {
    errors.push('내용을 입력해주세요.')
  }

  if (errors.length > 0) {
    return res.render('admin/posts/new', {
      errors,
      formData: req.body
    })
  }

  ctx.validatedData = { title, content, categoryId }
}
```

### 4. Slug 생성 패턴

```javascript
// features/admin/posts/new/@post/steps/300-generate-slug.js
import { prisma } from '../../../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { title } = ctx.validatedData

  // URL 안전한 slug 생성 (한글 제거, 영숫자와 하이픈만 허용)
  let baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')  // 한글 및 특수문자 제거
    .substring(0, 50)

  // 중복 확인 및 번호 추가
  let slug = baseSlug
  let counter = 1

  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  ctx.slug = slug
}
```

### 5. 페이지네이션 패턴

```javascript
// features/@get/steps/100-fetch-posts.js (홈 페이지)
export default async (ctx, req, res) => {
  const page = parseInt(req.query.page) || 1
  const perPage = 10
  const skip = (page - 1) * perPage

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: perPage,
      include: {
        author: { select: { displayName: true } },
        category: true
      }
    }),
    prisma.post.count({ where: { published: true } })
  ])

  ctx.posts = posts
  ctx.pagination = {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage)
  }
}
```

## Context (ctx) 구조

각 기능의 표준 context 객체:

### 공개 페이지
```javascript
{
  post: {},           // 단일 게시물
  posts: [],          // 게시물 목록
  category: {},       // 카테고리
  tags: [],           // 태그 목록
  pagination: {},     // 페이지네이션 정보
  relatedPosts: []    // 관련 게시물
}
```

### 관리자 페이지
```javascript
{
  currentUser: {},    // 현재 로그인한 사용자
  post: {},           // 수정 중인 게시물
  posts: [],          // 게시물 목록
  categories: [],     // 카테고리 목록
  tags: [],           // 태그 목록
  stats: {},          // 통계 정보
  validatedData: {},  // 검증된 입력 데이터
  errors: []          // 에러 목록
}
```

## 미들웨어 통합

### 전역 미들웨어 (app.js)

```javascript
// 설치 확인 미들웨어
app.use(async (req, res, next) => {
  const installed = await prisma.setting.findUnique({
    where: { key: 'installed' }
  })

  if (!installed || installed.value !== 'true') {
    if (!req.path.startsWith('/install')) {
      return res.redirect('/install')
    }
  }

  next()
})

// 세션 미들웨어
import session from 'express-session'
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}))
```

## 에러 처리

### Feature 레벨 에러 처리

```javascript
// features/blog/posts/[slug]/@get/index.js (선택사항)
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: (error, ctx, req, res) => {
    console.error('게시물 조회 오류:', error)
    res.status(500).render('errors/500', {
      message: '서버 오류가 발생했습니다.'
    })
  }
})
```

## 다음 단계

- 상세한 인증/인가 시스템 설계
- 구현 로드맵 작성
- 실제 구현 시작
