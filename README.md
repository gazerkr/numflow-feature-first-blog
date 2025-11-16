# Numflow Blog - Feature-First Showcase

> **A comprehensive self-hosted blog system demonstrating Numflow's Feature-First architecture**

[![Tests](https://img.shields.io/badge/tests-188%20passing-brightgreen)](https://github.com)
[![Numflow](https://img.shields.io/badge/Numflow-5.x-blue)](https://github.com/gazerkr/numflow)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**English** | [Korean](README.ko.md)

## 🎯 Project Introduction

This project is the **official showcase for the Numflow framework**. It's a fully functional **self-hosted blog system** that demonstrates how to leverage Numflow's core feature—**Feature-First automatic orchestration**—in practical applications.

Built with attention to quality and maintainability, this project serves as both a **learning resource** and **reference implementation** for developers exploring Numflow's capabilities.

## 🚀 What is Numflow?

**Numflow** is a Node.js web framework that maintains full compatibility with Express 5.x while delivering improved performance through optimized routing (up to 3x faster in benchmarks).

### Core Strengths of Numflow

- ⚡ **High Performance**: Optimized routing delivers 3x faster processing compared to Express
- 🔄 **Express Compatibility**: Works with Express 5.x middleware and patterns
- 🎨 **Feature-First Architecture**: Organize business logic using folder structures and conventions
- 📦 **Convention over Configuration**: Reduce boilerplate through sensible defaults
- 🧩 **Modularity**: Clear separation and reusability by feature

👉 **Numflow Official Repository**: [github.com/gazerkr/numflow](https://github.com/gazerkr/numflow)

## ✨ What is Feature-First Architecture?

Numflow's **core feature** is an architecture that automatically orchestrates complex business logic using folder structures and file naming conventions.

### How It Works

```
features/admin/posts/@post/steps/
├── 100-auth.js          # Step 1: Authentication check
├── 200-validate.js      # Step 2: Data validation
├── 300-create-post.js   # Step 3: Post creation
└── 400-redirect.js      # Step 4: Redirect
```

Just create a folder structure like this:
- ✅ `POST /admin/posts` endpoint is automatically registered
- ✅ 4 steps execute automatically in order: 100 → 200 → 300 → 400
- ✅ Data is automatically shared between steps via the `ctx` object
- ✅ **No configuration files or router registration code needed!**

### Core Advantages

#### 1️⃣ **Improved Productivity**
- Register multiple endpoints by creating folders
- Reduce boilerplate router configuration and middleware chaining
- Focus on business logic implementation

#### 2️⃣ **Clear Separation of Concerns**
- Separation between HTTP layer (`req`, `res`) and business logic (`ctx`)
- Each step handles a single responsibility
- Facilitates testing and maintenance

#### 3️⃣ **Intuitive Structure**
- Folder structure reflects API structure
- File numbering indicates execution order
- Understand flow from folder organization

#### 4️⃣ **Flexible Configuration**
- Add explicit configuration with `index.js` when needed
- Convention over configuration, with escape hatches

## 🎨 Real-World Numflow Usage in This Project

### 1. Complex Multi-Step Business Logic

**Post Creation Process** (`features/admin/posts/@post/`)
```
steps/
├── 100-auth.js        # Authentication check
├── 200-validate.js    # Title/content validation
├── 300-create-post.js # DB save + slug generation
└── 400-redirect.js    # Success page redirect
```
→ **4 independent files** execute automatically in sequence, with **zero configuration code**

### 2. RESTful API Implementation

```
features/admin/posts/
├── @get/              → GET /admin/posts (list)
├── @post/             → POST /admin/posts (create)
├── [id]/@get/         → GET /admin/posts/:id (read)
├── [id]/@put/         → PUT /admin/posts/:id (update)
└── [id]/@delete/      → DELETE /admin/posts/:id (delete)
```
→ **5 folders** implement full CRUD operations

### 3. Dynamic Routing

Folders named `[id]`, `[slug]` automatically recognize dynamic parameters:
- `features/blog/[slug]/@get/` → `GET /blog/:slug`
- `features/api/comments/[id]/@delete/` → `DELETE /api/comments/:id`

### 4. Context-Based Data Flow

```javascript
// 100-validate.js
export default async (ctx, req, res) => {
  ctx.validatedData = { title, content } // Store in ctx
}

// 200-create-post.js
export default async (ctx, req, res) => {
  const post = await prisma.post.create({
    data: ctx.validatedData  // Use from ctx
  })
  ctx.createdPost = post
}

// 300-redirect.js
export default async (ctx, req, res) => {
  res.redirect(`/admin/posts/${ctx.createdPost.id}`)
}
```
→ **Clear separation** of HTTP layer and business logic

### 5. Complete Implementation

- ✅ **188 integration tests** covering core functionality
- ✅ **Prisma ORM** for type-safe database operations
- ✅ **Session-based authentication** and authorization
- ✅ **Markdown** editor with rendering
- ✅ **Image upload** functionality
- ✅ **Full-text search** capability
- ✅ **Security measures** including XSS and SQL injection prevention

## 🏗️ Key Features

### 📝 Blog Core Features
- **Post Management**: Markdown editor, cover images, publish/draft status
- **Categories & Tags**: Hierarchical classification and filtering
- **Comment System**: Real-time commenting and moderation
- **Full-Text Search**: Search by title, content, excerpt
- **Pagination**: Efficient handling of large datasets

### 🔐 Authentication & Authorization
- **Password Security**: bcrypt-based password hashing
- **Session Management**: Express session integration
- **Role-Based Access**: Admin, Editor, and Viewer roles
- **Setup Flow**: Guided installation on first run

### 🎨 Admin Panel
- **Dashboard**: Statistics and recent posts overview
- **Content Management**: Posts, categories, and tags administration
- **Settings**: Blog configuration and user profile
- **Media**: Image upload handling

### ⚡ Tech Stack
- **Numflow**: Express-compatible high-performance framework
- **Prisma ORM**: Type-safe database
- **SQLite**: Zero-configuration embedded DB
- **EJS**: Server-side templates
- **Vitest**: 188 integration tests

## 📖 Learning Guide

You can learn the following from this project:

### 1. Feature-First Basic Patterns
→ See `features/install/` folder
- Understand Feature-First with the simplest structure
- How to use `@get`, `@post` method folders
- Sequential steps execution flow

### 2. Multi-Step Business Logic
→ See `features/admin/posts/@post/` folder
- 4-step process: authentication → validation → creation → response
- How to separate responsibilities at each step
- Error handling and early termination patterns

### 3. RESTful API Design
→ See `features/admin/categories/` folder
- Implementing complete CRUD endpoints
- Dynamic parameter handling (`[id]` folders)
- Consistent response structure

### 4. Complex Query Handling
→ See `features/blog/search/` folder
- Search query parsing and validation
- Writing complex Prisma queries
- Pagination implementation

### 5. File Upload
→ See `features/api/upload/image/` folder
- Multipart form data handling
- File validation and storage
- Error handling

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/gazerkr/numflow-feature-first-blog.git
cd numflow-feature-first-blog

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Create .env file
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5555
NODE_ENV=development
APP_NAME="Numflow Blog"
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-this-to-random-string"
```

### 3. Database Initialization

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed sample data
npx prisma db seed
```

### 4. Run

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access and Install

1. Navigate to `http://localhost:5555` in your browser
2. Automatically redirected to installation page
3. Enter administrator information (username, email, password)
4. After installation completes, log in
5. Start managing your blog at `/admin`!

## 📁 Project Structure (Feature-First)

```
features/                       # Feature-First structure
│
├── install/                    # Installation feature
│   ├── @get/steps/
│   │   └── 100-check.js       # Check installation status
│   └── @post/steps/
│       ├── 100-validate.js    # Input validation
│       ├── 200-create-admin.js # Create administrator
│       └── 300-mark-installed.js # Mark installation complete
│
├── auth/                       # Authentication feature
│   ├── login/@post/steps/
│   │   ├── 100-validate.js
│   │   ├── 200-authenticate.js
│   │   └── 300-create-session.js
│   └── logout/@post/steps/
│       └── 100-destroy-session.js
│
├── admin/                      # Admin panel
│   ├── @get/steps/            # Dashboard
│   │   ├── 100-auth.js
│   │   ├── 200-fetch-stats.js
│   │   └── 300-render.js
│   │
│   ├── posts/                  # Post management
│   │   ├── @get/              # List
│   │   ├── @post/             # Create
│   │   ├── [id]/@put/         # Update
│   │   └── [id]/@delete/      # Delete
│   │
│   ├── categories/             # Category management
│   └── tags/                   # Tag management
│
├── blog/                       # Blog public pages
│   ├── @get/                  # List
│   ├── [slug]/@get/           # Detail page
│   ├── category/[slug]/@get/  # By category
│   ├── tag/[slug]/@get/       # By tag
│   └── search/@get/           # Search
│
└── api/                        # API endpoints
    ├── comments/
    ├── search/
    └── upload/
```

**→ Folder structure = API structure = Execution flow**

## 🧪 Testing

```bash
# Run all tests (188)
npm test

# Test specific feature
npm test -- tests/features/install.test.js

# Coverage
npm run test:coverage
```

**Test Status**: ✅ 26 files, 188 tests all passing

## 📚 Detailed Documentation

- [01-overview.md](docs/en/01-overview.md) - Project overview
- [02-database-schema.md](docs/en/02-database-schema.md) - Database schema
- [03-features-and-pages.md](docs/en/03-features-and-pages.md) - Feature specifications
- [04-feature-first-structure.md](docs/en/04-feature-first-structure.md) - **Feature-First architecture details**
- [05-authentication.md](docs/en/05-authentication.md) - Authentication system

## 🎯 Why Consider Numflow

### ✅ What This Project Demonstrates

1. **Improved Productivity**: Feature-First architecture streamlines development workflow
2. **Maintainability**: Folder structure provides clear overview of application flow
3. **Scalability**: Adding features involves creating new folders with consistent patterns
4. **Testability**: Step-based architecture enables focused unit testing
5. **Team Collaboration**: Feature-based separation supports parallel development
6. **Familiar Ecosystem**: Express developers can apply existing knowledge

### 🚀 Considerations for Express Users

- **100% compatible** with Express middleware and patterns
- **Performance improvements** through optimized routing and request handling
- **Feature-First architecture** provides structured approach for larger applications
- **Minimal learning curve** for developers familiar with Express

## 🤝 Contributing

This showcase project is part of the Numflow ecosystem.

- 🐛 Bug Reports: [Issues](https://github.com/gazerkr/numflow-feature-first-blog/issues)
- 💡 Feature Suggestions: [Discussions](https://github.com/gazerkr/numflow-feature-first-blog/discussions)
- 🔧 Pull Requests: Always welcome!

## 🔗 Related Links

- **Numflow Official Repository**: https://github.com/gazerkr/numflow
- **Feature-First Documentation**: https://github.com/gazerkr/numflow/blob/main/docs/en/api/feature.md
- **Numflow Documentation**: https://github.com/gazerkr/numflow/tree/main/docs
- **Prisma**: https://www.prisma.io
- **Vitest**: https://vitest.dev

## 📄 License

MIT License - Numflow Showcase Project

---

<div align="center">

**This project demonstrates Numflow's Feature-First architecture in a practical application.**

⭐ If you find this useful, consider giving [Numflow](https://github.com/gazerkr/numflow) a GitHub Star.

Built with [Numflow](https://github.com/gazerkr/numflow)

</div>
