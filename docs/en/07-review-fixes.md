# Design Document Review and Revisions

## Review Date
November 14, 2025

## Review Purpose
Identify and fix all issues and improvements in design documents before Phase 1 implementation

---

## Major Revisions

### Critical Issues (Must fix before implementation)

#### 1. Complete Prisma schema.prisma File
**Issue**: Only existed in design documents, not as actual file

**Resolution**:
- Created complete schema in `prisma/schema.prisma`
- Added User, Category, Tag, PostTag, Setting models
- Extended Post model (author, category relationships, contentHtml, coverImage, publishedAt, viewCount)
- Completed all indexes and relationships
- Configured SQLite onDelete: Cascade, SetNull

#### 2. Unified Login Path
**Issue**: Inconsistent login paths across documents
- 03-features-and-pages.md: `/admin/login`
- 05-authentication.md: `/auth/login`

**Resolution**: Unified all documents to use `/auth/login`

#### 3. Fixed lib/utils.js Model Parameter Error
**Issue**:
```javascript
// Incorrect code
while (await prisma[model].findUnique({ where: { slug: currentSlug } })) {
```
- prisma['post'] doesn't work (only prisma.post works)

**Resolution**:
```javascript
// Corrected code
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

#### 4. ESM-Compatible SESSION_SECRET Generation Command
**Issue**:
```bash
# Doesn't work (ESM project)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Resolution**:
```bash
# Method 1 (recommended)
openssl rand -hex 32

# Method 2
node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
```

#### 5. Non-ASCII Slug Handling Issue
**Issue**: Encoding issues when non-ASCII characters are included in URLs

**Resolution**:
```javascript
// Before
.replace(/[^a-z0-9-\u1100-\u11FF\uAC00-\uD7A3]/g, '')  // Include Unicode ranges ❌

// After
.replace(/[^a-z0-9-]/g, '')  // ASCII only, rely on transliteration ✅
```

#### 6. Fixed Feature-First Folder Structure
**Issue**: `features/blog/` folder incorrectly designed
- `features/blog/@get/` would become `/blog` path (incorrect)

**Resolution**:
```
features/
├── @get/                 # Home (/) ✅
├── posts/[slug]/@get/    # /posts/:slug ✅
├── category/[slug]/@get/ # /category/:slug ✅
├── tag/[slug]/@get/      # /tag/:slug ✅
└── search/@get/          # /search ✅
```

---

### Important Improvements

#### 7. Changed to bcryptjs
**Reason**: `bcrypt` is a native module causing installation issues on some environments (Windows, Alpine Linux)

**Change**:
- `npm install bcrypt` → `npm install bcryptjs`
- `import bcrypt from 'bcrypt'` → `import bcrypt from 'bcryptjs'`

#### 8. Adjusted Markdown Rendering Phase
**Change**:
- Phase 5 optional → Phase 5 required feature
- Use `marked`, `isomorphic-dompurify` libraries
- Create `lib/markdown.js`
- Apply DOMPurify sanitize for XSS prevention

#### 9. Added 403 Error Page
**Added**: `views/errors/403.ejs` template

#### 10. Removed Duplicate Authentication Middleware
**Improvement**:
- Global `loadCurrentUser` middleware already sets `req.currentUser`
- No need for DB re-query in feature-level steps

**Before**:
```javascript
// Duplicate query ❌
export default async (ctx, req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }

  ctx.currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId }
  })
}
```

**After**:
```javascript
// Efficient ✅
export default async (ctx, req, res) => {
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }

  ctx.currentUser = req.currentUser  // Already exists
}
```

#### 11. Improved Installation Check Middleware
**Improvements**:
- Exception handling for static files, /install path
- Handle DB connection failures with try-catch

```javascript
app.use(async (req, res, next) => {
  // Exclude static files and /install path from check
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

#### 12. Added Tag Processing Transaction
**Improvement**: Process post creation and tag creation in single transaction (ensures atomicity)

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

#### 13. Enabled SQLite Foreign Keys
**Added**: Add Foreign Keys activation code in `lib/prisma.js`

```javascript
// Enable foreign keys (makes CASCADE constraints work)
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
```

---

## Modified Files List

### Newly Created Files
1. ✅ `prisma/schema.prisma` - Complete database schema
2. ✅ `docs/07-review-fixes.md` - This document

### Modified Documents
1. ✅ `docs/03-features-and-pages.md`
   - Login path `/admin/login` → `/auth/login`
   - bcrypt → bcryptjs

2. ✅ `docs/04-feature-first-structure.md`
   - Fixed folder structure (removed blog/ folder)
   - Fixed Korean slug handling
   - Updated path examples

3. ✅ `docs/05-authentication.md`
   - ESM-compatible SESSION_SECRET generation command

4. ✅ `docs/06-implementation-roadmap.md`
   - Changed to bcryptjs
   - Updated SESSION_SECRET command
   - Fixed lib/utils.js model parameter
   - Fixed Korean slug handling
   - Improved installation check middleware
   - Removed duplicate authentication middleware
   - Added tag processing transaction
   - Added markdown rendering and SQLite setup to Phase 5
   - Added 403 error page
   - Updated estimated time

---

## Next Steps

### Implementation Ready
All design documents have been reviewed and revised. Ready to start implementation from Phase 1.

### Recommended Implementation Order
1. **Phase 1 (7 hours)**: Prisma migration → Common libraries → Installation system
2. **Phase 2 (2 hours)**: Login/Logout
3. **Phase 4.2 (3 hours)**: Post creation (admins need to create posts first for testing)
4. **Phase 3 (4 hours)**: Public blog (post list, details)
5. **Phase 5 (2 hours)**: Markdown rendering, SQLite setup
6. **Phase 4 remaining (5 hours)**: Dashboard, post list/edit/delete

### First Run Commands
```bash
# 1. Install packages
npm install

# 2. Prisma migration
npx prisma migrate dev --name add_blog_models

# 3. Verify with Prisma Studio
npx prisma studio

# 4. Run development server
npm run dev
```

---

## Change Statistics

- **Modified documents**: 4 files
- **Newly created files**: 2 files
- **Modified code blocks**: 15 blocks
- **Added features**: 3 (markdown, SQLite FK, transactions)
- **Removed issues**: 13 issues

---

## Reviewer Notes

### Design Strengths
1. Effective use of Feature-First architecture
2. Thorough security considerations (bcryptjs, XSS prevention, CSRF)
3. Clear step-by-step implementation
4. Enhanced security with UUID usage

### Implementation Cautions
1. Must backup existing data before migration
2. Need error handling even when DB doesn't exist on first install
3. Test thoroughly in development before production deployment
4. SESSION_SECRET must use strong random value

### Future Considerations
1. Image upload functionality (multer)
2. SEO optimization (meta tags, sitemap.xml, robots.txt)
3. RSS feed generation
4. Auto-save for drafts while writing
5. Comment system (optional)
