# Feature-First Structure Design

## Overall Structure

```
features/
├── install/              # Installation feature
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
├── auth/                 # Authentication feature
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
├── @get/                 # Home (post list) - path: /
│   └── steps/
│       ├── 100-fetch-posts.js
│       ├── 200-render.js
│
├── posts/                # Post detail view
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-post.js
│               ├── 200-increase-view.js
│               └── 300-render.js
│
├── category/             # View by category
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-category.js
│               ├── 200-fetch-posts.js
│               └── 300-render.js
│
├── tag/                  # View by tag
│   └── [slug]/
│       └── @get/
│           └── steps/
│               ├── 100-fetch-tag.js
│               ├── 200-fetch-posts.js
│               └── 300-render.js
│
├── search/               # Search
│   └── @get/
│       └── steps/
│           ├── 100-parse-query.js
│           ├── 200-search.js
│           └── 300-render.js
│
└── admin/                # Admin features
    ├── @get/            # Dashboard
    │   └── steps/
    │       ├── 100-check-auth.js
    │       ├── 200-fetch-stats.js
    │       ├── 300-fetch-recent.js
    │       └── 400-render.js
    ├── posts/
    │   ├── @get/        # Post list
    │   │   └── steps/
    │   │       ├── 100-check-auth.js
    │   │       ├── 200-fetch-posts.js
    │   │       └── 300-render.js
    │   ├── new/
    │   │   ├── @get/    # Create form
    │   │   │   └── steps/
    │   │   │       ├── 100-check-auth.js
    │   │   │       ├── 200-fetch-options.js
    │   │   │       └── 300-render.js
    │   │   └── @post/   # Create processing
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
    │   ├── @get/        # Category list
    │   └── @post/       # Create category
    ├── tags/
    │   ├── @get/        # Tag list
    │   └── @post/       # Create tag
    └── settings/
        ├── @get/        # Settings screen
        └── @post/       # Save settings
```

## Key Patterns

### 1. Authentication Check Pattern

First step in all `/admin/*` paths:

```javascript
// features/admin/.../steps/100-check-auth.js
export default async (ctx, req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }

  // Get user information
  ctx.currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId }
  })

  if (!ctx.currentUser || !ctx.currentUser.isActive) {
    req.session.destroy()
    return res.redirect('/auth/login')
  }
}
```

### 2. Data Fetching Pattern

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
      message: 'Post not found.'
    })
  }

  ctx.post = post
}
```

### 3. Validation Pattern

```javascript
// features/admin/posts/new/@post/steps/200-validate.js
export default async (ctx, req, res) => {
  const { title, content, categoryId } = req.body
  const errors = []

  if (!title || title.trim().length === 0) {
    errors.push('Please enter a title.')
  }

  if (!content || content.trim().length === 0) {
    errors.push('Please enter content.')
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

### 4. Slug Generation Pattern

```javascript
// features/admin/posts/new/@post/steps/300-generate-slug.js
import { prisma } from '../../../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { title } = ctx.validatedData

  // Generate URL-safe slug (remove Korean, allow only alphanumeric and hyphens)
  let baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')  // Remove Korean and special characters
    .substring(0, 50)

  // Check for duplicates and add numbers
  let slug = baseSlug
  let counter = 1

  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  ctx.slug = slug
}
```

### 5. Pagination Pattern

```javascript
// features/@get/steps/100-fetch-posts.js (home page)
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

## Context (ctx) Structure

Standard context object for each feature:

### Public Pages
```javascript
{
  post: {},           // Single post
  posts: [],          // Post list
  category: {},       // Category
  tags: [],           // Tag list
  pagination: {},     // Pagination info
  relatedPosts: []    // Related posts
}
```

### Admin Pages
```javascript
{
  currentUser: {},    // Currently logged in user
  post: {},           // Post being edited
  posts: [],          // Post list
  categories: [],     // Category list
  tags: [],           // Tag list
  stats: {},          // Statistics
  validatedData: {},  // Validated input data
  errors: []          // Error list
}
```

## Middleware Integration

### Global Middleware (app.js)

```javascript
// Installation check middleware
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

// Session middleware
import session from 'express-session'
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

## Error Handling

### Feature-Level Error Handling

```javascript
// features/blog/posts/[slug]/@get/index.js (optional)
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: (error, ctx, req, res) => {
    console.error('Post fetch error:', error)
    res.status(500).render('errors/500', {
      message: 'A server error occurred.'
    })
  }
})
```

## Next Steps

- Detailed authentication/authorization system design
- Write implementation roadmap
- Start actual implementation
