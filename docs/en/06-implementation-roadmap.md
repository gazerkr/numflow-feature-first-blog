# Implementation Roadmap

## Implementation Principles

1. **Bottom-Up Approach**: Build foundation systems first
2. **Phase-by-Phase Testing**: Test after each Phase completion
3. **Incremental Feature Addition**: Core → Additional features order
4. **Data Integrity First**: Thorough migration strategy

## Phase 1: Foundation System (7 hours)

### Goals
- Finalize database schema
- Implement common libraries
- Complete installation system

### Task List

#### 1.1 Prisma Schema Extension and Migration (1 hour)
**Tasks:**
1. Update `prisma/schema.prisma`
   - Add User, Category, Tag, PostTag, Setting models
   - Extend Post model (add author, category relationships)
   - Optimize indexes

2. Run migration
   ```bash
   npx prisma migrate dev --name add_blog_models
   ```

3. Update seed data
   - Modify `prisma/seed.js`
   - Add 3 default categories
   - Add installation flag

**Verification:**
```bash
npx prisma studio
# Verify all tables are created
```

#### 1.2 Write Common Libraries (2 hours)
**File List:**
- `lib/auth.js`: Password hashing/verification
- `lib/middleware.js`: Authentication/authorization middleware
- `lib/validators.js`: Validation functions
- `lib/utils.js`: Utility functions (slug generation, etc.)

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

#### 1.3 Session Setup (30 minutes)
**Tasks:**
1. Install packages
   ```bash
   npm install express-session bcryptjs
   ```
   > Note: `bcryptjs` is pure JavaScript implementation, works reliably on all platforms

2. Add session middleware to app.js

3. Add SESSION_SECRET to .env
   ```bash
   openssl rand -hex 32
   # Or
   node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
   ```

#### 1.4 Implement Installation Feature (3 hours)
**Folder Structure:**
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

#### 1.5 Installation Check Middleware (30 minutes)
Add to app.js before feature registration:
```javascript
app.use(async (req, res, next) => {
  // Exclude static files and /install path
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
    console.error('Installation check error:', error)
    return res.redirect('/install')
  }
})
```

**Phase 1 Checklist:**
- [ ] Prisma schema extension complete
- [ ] Migration successful
- [ ] lib/ common libraries written
- [ ] Session setup complete
- [ ] Installation feature working
- [ ] Installation check middleware working

---

## Phase 2: Authentication System (2 hours)

### Goals
- Login/logout functionality
- Session management
- Admin authorization verification

### Task List

#### 2.1 Login Feature (2 hours)
**Folder Structure:**
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

**Phase 2 Checklist:**
- [ ] Login feature working
- [ ] Logout feature working
- [ ] Session persistence verified
- [ ] Invalid credentials handled
- [ ] Inactive accounts blocked

---

## Phase 3: Public Blog Features (4 hours)

### Goals
- Display published posts list
- View post details
- View by category/tag

### Task List

#### 3.1 Extend Home (Post List) Feature (2 hours)
**Key Implementation:**
- Pagination support
- Include author, category, tags
- Sort by publication date

#### 3.2 Post Detail View (2 hours)
**Features:**
- Markdown rendering
- View count increment
- Author information
- Related posts

**Phase 3 Checklist:**
- [ ] Home page displays post list
- [ ] Pagination working
- [ ] Post detail view working
- [ ] View count incrementing
- [ ] 404 error page displays

---

## Phase 4: Admin Features (8 hours)

### Goals
- Admin dashboard
- Create/edit/delete posts
- Manage categories/tags

### Task List

#### 4.1 Admin Dashboard (2 hours)
**Features:**
- Statistics (total posts, published, views)
- Recent posts list
- Quick actions

#### 4.2 Create Post Feature (3 hours)
**Features:**
- Markdown editor
- Category/tag selection
- Publish/draft toggle
- Automatic tag creation
- Transaction-based processing

#### 4.3 Post List Feature (1 hour)
**Features:**
- All posts (published/unpublished)
- Search/filtering
- Delete functionality

#### 4.4 Edit/Delete Post Feature (2 hours)
**Features:**
- Load existing post
- Same interface as creation
- Secure deletion with confirmation

**Phase 4 Checklist:**
- [ ] Admin dashboard working
- [ ] Statistics display
- [ ] Post creation working
- [ ] Automatic tag creation verified
- [ ] Post list display
- [ ] Post edit working
- [ ] Post delete working

---

## Phase 5: Advanced Features (2 hours)

### 5.1 Markdown Rendering (Required - 1 hour)
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

### 5.2 Enable SQLite Foreign Keys (Required)
**lib/prisma.js update:**
```javascript
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
```

### 5.3 View by Category/Tag (Optional)
### 5.4 Search Functionality (Optional)

---

## Database Migration Strategy

### Current State
- Post, Feature, TechStack models exist

### Expansion Plan
1. **1st Migration**: Add User, Setting
2. **2nd Migration**: Add Category, Tag, PostTag
3. **3rd Migration**: Extend Post model (author, category relationships)

### Migration Commands
```bash
# Development environment
npx prisma migrate dev --name migration_name

# Production environment
npx prisma migrate deploy
```

---

## Test Strategy

### Phase-by-Phase Testing

**Phase 1:**
- [ ] Installation process complete
- [ ] Admin account created
- [ ] Default settings saved
- [ ] Post-installation redirect working

**Phase 2:**
- [ ] Login success/failure cases
- [ ] Session persistence verified
- [ ] Logout working
- [ ] Unauthorized access blocked

**Phase 3:**
- [ ] Only published posts displayed
- [ ] Pagination working
- [ ] Post detail view
- [ ] View count increment

**Phase 4:**
- [ ] Admin dashboard statistics
- [ ] Post create/edit/delete
- [ ] Auto tag creation
- [ ] Slug duplication prevention

---

## Deployment Checklist

### Environment Setup
- [ ] Set production values in .env file
- [ ] Generate SESSION_SECRET
- [ ] Set NODE_ENV=production

### Database
- [ ] Run production migration
- [ ] Establish backup strategy

### Security
- [ ] Configure HTTPS
- [ ] Enable secure cookies
- [ ] Apply password policy
- [ ] CSRF tokens (optional)

### Performance
- [ ] Static file caching
- [ ] Verify database indexes
- [ ] Optimize N+1 queries

---

## Estimated Total Time

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1: Foundation | 7 hours | Prisma, common libraries, installation |
| Phase 2: Authentication | 2 hours | Login/logout |
| Phase 3: Public Blog | 4 hours | Post list, detail view |
| Phase 4: Admin | 8 hours | Dashboard, post CRUD |
| Phase 5: Advanced (Required) | 2 hours | Markdown, SQLite setup |
| **Total (MVP)** | **23 hours** | Excluding category/tag/search |
| **Total (Full)** | **25-27 hours** | All features included |

---

## Priority Recommendations

### Minimum Features (MVP)
1. Phase 1: Installation system
2. Phase 2: Authentication system
3. Phase 4.2: Post creation
4. Phase 3: Public blog

### Completeness Enhancement
1. Phase 4.1, 4.3, 4.4: Complete admin features
2. View by category/tag
3. Search functionality

### Additional Improvements
1. Markdown rendering
2. Image upload
3. SEO optimization
4. RSS feed

---

## Next Steps

Design complete! Choose one of the following:

1. **Start implementing from Phase 1**
2. **Review and revise design documents**
3. **Discuss additional features**

---

## Key Implementation Files

For detailed code examples, see:
- Korean original: Full code templates, EJS views, step-by-step implementations
- This summary: Core structure and key patterns

Refer to other documentation files for:
- 01-overview.md: System architecture
- 02-database-schema.md: Database design
- 03-features-and-pages.md: Feature specifications
- 04-feature-first-structure.md: Code patterns
- 05-authentication.md: Security implementation
- 07-review-fixes.md: Design corrections
