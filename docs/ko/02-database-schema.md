# 데이터베이스 스키마 설계

## 설계 원칙

1. **모든 ID는 UUID 사용** (String 타입)
2. **자동 createdAt, updatedAt 관리**
3. **Soft Delete 지원** (필요시)
4. **명확한 관계 설정**

## 스키마 정의

### 1. User (사용자/관리자)

```prisma
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  password      String    // bcrypt 해시
  displayName   String
  role          String    @default("admin")  // admin, editor, etc.
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 관계
  posts         Post[]

  @@map("users")
}
```

**필드 설명:**
- `username`: 로그인 ID
- `email`: 이메일 (비밀번호 복구 등에 사용)
- `password`: bcrypt로 해시된 비밀번호
- `displayName`: UI에 표시될 이름
- `role`: 권한 수준
- `isActive`: 계정 활성화 상태

### 2. Post (블로그 게시물) - 확장

```prisma
model Post {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  content       String    // Markdown
  contentHtml   String?   // 렌더링된 HTML (캐시)
  excerpt       String?
  coverImage    String?   // 커버 이미지 URL
  published     Boolean   @default(false)
  publishedAt   DateTime?
  viewCount     Int       @default(0)

  // 관계
  authorId      String
  author        User      @relation(fields: [authorId], references: [id])

  categoryId    String?
  category      Category? @relation(fields: [categoryId], references: [id])

  tags          PostTag[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("posts")
  @@index([slug])
  @@index([published, publishedAt])
  @@index([authorId])
}
```

**추가된 필드:**
- `contentHtml`: 마크다운에서 변환된 HTML 캐시
- `coverImage`: 썸네일/커버 이미지
- `publishedAt`: 발행 시각 (예약 발행 지원)
- `viewCount`: 조회수
- `authorId`: 작성자

### 3. Category (카테고리)

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 관계
  posts       Post[]

  @@map("categories")
}
```

### 4. Tag (태그)

```prisma
model Tag {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // 관계
  posts     PostTag[]

  @@map("tags")
}
```

### 5. PostTag (Post-Tag 다대다 관계)

```prisma
model PostTag {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  tagId     String
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([postId, tagId])
  @@map("post_tags")
}
```

### 6. Setting (블로그 설정)

```prisma
model Setting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  type        String   @default("string")  // string, number, boolean, json
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("settings")
}
```

**주요 Setting 키:**
- `blog.name`: 블로그 이름
- `blog.description`: 블로그 설명
- `blog.url`: 블로그 URL
- `blog.postsPerPage`: 페이지당 게시물 수
- `blog.theme`: 테마
- `installed`: 설치 완료 여부
- `installedAt`: 설치 시각

### 7. Feature (기존 유지)

```prisma
model Feature {
  id          String   @id @default(uuid())
  title       String
  description String
  icon        String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("features")
}
```

### 8. TechStack (기존 유지)

```prisma
model TechStack {
  id          String   @id @default(uuid())
  name        String
  category    String
  version     String?
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tech_stacks")
}
```

## 관계 다이어그램

```
User (1) -----> (N) Post
Post (N) -----> (1) Category
Post (N) <----> (N) Tag (through PostTag)
```

## 인덱스 전략

### 성능 최적화를 위한 인덱스:

1. **Post**
   - `slug`: 단일 게시물 조회
   - `[published, publishedAt]`: 발행된 게시물 목록 (최신순)
   - `authorId`: 작성자별 게시물 목록
   - `categoryId`: 카테고리별 게시물 목록

2. **User**
   - `username`: 로그인
   - `email`: 이메일 조회

3. **Category, Tag**
   - `slug`: URL 기반 조회

## 초기 데이터

### Setting 초기값

```javascript
[
  { key: 'blog.name', value: 'My Blog', type: 'string' },
  { key: 'blog.description', value: 'Numflow 기반 블로그', type: 'string' },
  { key: 'blog.postsPerPage', value: '10', type: 'number' },
  { key: 'installed', value: 'false', type: 'boolean' },
]
```

### Category 기본값

```javascript
[
  { name: '일반', slug: 'general', description: '일반 카테고리' },
  { name: '기술', slug: 'tech', description: '기술 관련 게시물' },
  { name: '일상', slug: 'daily', description: '일상 이야기' },
]
```

## 마이그레이션 전략

### Phase 1: 기존 스키마 확장
- User, Category, Tag, PostTag, Setting 추가
- Post 모델에 관계 필드 추가

### Phase 2: 데이터 마이그레이션
- 기존 Post를 기본 작성자에게 연결
- 기본 카테고리 생성

### Phase 3: 제약 조건 추가
- NOT NULL 제약 조건
- Foreign Key 제약 조건

## 보안 고려사항

1. **비밀번호**
   - bcrypt로 해싱 (salt rounds: 10)
   - 절대 평문 저장 금지

2. **UUID 사용**
   - 예측 불가능한 ID
   - URL에 직접 노출해도 안전

3. **Soft Delete**
   - 필요시 `deletedAt` 필드 추가
   - 실제 삭제 대신 플래그 설정

## 다음 단계

- Prisma 스키마 파일 업데이트
- 마이그레이션 생성 및 실행
- 시드 데이터 작성
