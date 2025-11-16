# Database Schema Design

## Principles

1. **All IDs use UUID** (String type)
2. **Automatic createdAt, updatedAt management**
3. **Soft Delete support** (when needed)
4. **Clear relationships**

## Schema Definition

### 1. User (User/Admin)

```prisma
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  password      String    // bcrypt hash
  displayName   String
  role          String    @default("admin")  // admin, editor, etc.
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relationships
  posts         Post[]

  @@map("users")
}
```

**Field Description:**
- `username`: Login ID
- `email`: Email (used for password recovery, etc.)
- `password`: bcrypt hashed password
- `displayName`: Display name for UI
- `role`: Permission level
- `isActive`: Account activation status

### 2. Post (Blog Post) - Extended

```prisma
model Post {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  content       String    // Markdown
  contentHtml   String?   // Rendered HTML (cache)
  excerpt       String?
  coverImage    String?   // Cover image URL
  published     Boolean   @default(false)
  publishedAt   DateTime?
  viewCount     Int       @default(0)

  // Relationships
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

**Additional Fields:**
- `contentHtml`: Cached HTML conversion from markdown
- `coverImage`: Thumbnail/cover image
- `publishedAt`: Publication time (scheduled publishing support)
- `viewCount`: View count
- `authorId`: Author

### 3. Category

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  posts       Post[]

  @@map("categories")
}
```

### 4. Tag

```prisma
model Tag {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relationships
  posts     PostTag[]

  @@map("tags")
}
```

### 5. PostTag (Post-Tag Many-to-Many Relationship)

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

### 6. Setting (Blog Settings)

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

**Main Setting Keys:**
- `blog.name`: Blog name
- `blog.description`: Blog description
- `blog.url`: Blog URL
- `blog.postsPerPage`: Posts per page
- `blog.theme`: Theme
- `installed`: Installation completion status
- `installedAt`: Installation time

### 7. Feature (Keep existing)

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

### 8. TechStack (Keep existing)

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

## Relationship Diagram

```
User (1) -----> (N) Post
Post (N) -----> (1) Category
Post (N) <----> (N) Tag (through PostTag)
```

## Index Strategy

### Performance Optimization Indexes:

1. **Post**
   - `slug`: Single post lookup
   - `[published, publishedAt]`: Published post list (latest first)
   - `authorId`: Post list by author
   - `categoryId`: Post list by category

2. **User**
   - `username`: Login
   - `email`: Email lookup

3. **Category, Tag**
   - `slug`: URL-based lookup

## Initial Data

### Setting Initial Values

```javascript
[
  { key: 'blog.name', value: 'My Blog', type: 'string' },
  { key: 'blog.description', value: 'Numflow-based Blog', type: 'string' },
  { key: 'blog.postsPerPage', value: '10', type: 'number' },
  { key: 'installed', value: 'false', type: 'boolean' },
]
```

### Category Defaults

```javascript
[
  { name: 'General', slug: 'general', description: 'General category' },
  { name: 'Tech', slug: 'tech', description: 'Technology-related posts' },
  { name: 'Daily', slug: 'daily', description: 'Daily life stories' },
]
```

## Migration Strategy

### Phase 1: Extend Existing Schema
- Add User, Category, Tag, PostTag, Setting
- Add relationship fields to Post model

### Phase 2: Data Migration
- Link existing Posts to default author
- Create default categories

### Phase 3: Add Constraints
- NOT NULL constraints
- Foreign key constraints

## Security Considerations

1. **Password**
   - Hash with bcrypt (salt rounds: 10)
   - Never store in plain text

2. **UUID Usage**
   - Unpredictable IDs
   - Safe to expose directly in URLs

3. **Soft Delete**
   - Add `deletedAt` field when needed
   - Set flag instead of actual deletion

## Next Steps

- Update Prisma schema file
- Create and run migrations
- Write seed data
