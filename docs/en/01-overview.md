# Self-Hosted Blog System - Overview

## Project Introduction

A self-hosted blog system based on Numflow + EJS + Prisma + SQLite.
Designed with a modular structure using Feature-First architecture.

## Core Goals

1. **Easy Installation Process**
   - Automatic installation detection on first access
   - Start blogging with simple configuration
   - Automatic database migration

2. **Admin Features**
   - Secure admin account creation
   - Blog post creation/editing/deletion
   - Blog settings management

3. **Modern Blog Features**
   - Markdown support
   - Slug-based URLs
   - Public/private post management
   - Category/tag system

## Technology Stack

- **Framework**: Numflow (Express 5.x compatible)
- **Template Engine**: EJS
- **ORM**: Prisma
- **Database**: SQLite (optimal for self-hosted)
- **Authentication**: bcrypt + express-session
- **Architecture**: Feature-First

## Key Features

### 1. Self-Hosted System
- No separate server setup required
- Easy deployment using SQLite
- Easy backup with file-based database

### 2. Feature-First Architecture
```
features/
  install/          # Installation feature
  auth/            # Authentication feature
  admin/           # Admin feature
  blog/            # Blog feature
```

### 3. UUID-Based Security
- All IDs use UUID
- Unpredictable URLs
- Enhanced security

## User Flow

### Initial Installation
```
1. Access site
   ↓
2. Check installation status (middleware)
   ↓
3. If not installed → redirect to /install
   ↓
4. Installation process:
   - Enter blog information
   - Create admin account
   - Basic settings
   ↓
5. Installation complete → Main page
```

### General Usage
```
1. Main page (post list)
   ↓
2. View post details
   ↓
3. View by category
```

### Admin Usage
```
1. Login (/admin/login)
   ↓
2. Admin dashboard
   ↓
3. Create/edit/delete posts
   ↓
4. Manage settings
```

## Security Considerations

1. **Password Encryption**
   - Using bcrypt (salt rounds: 10)

2. **Session Management**
   - Using express-session
   - Secure cookie configuration

3. **CSRF Prevention**
   - Token verification for POST requests

4. **XSS Prevention**
   - EJS auto-escaping
   - Markdown sanitization

## Directory Structure

```
sqlite-feature-blog/
├── docs/                    # Design documents
├── features/                # Feature-First structure
│   ├── install/            # Installation feature
│   ├── auth/               # Authentication feature
│   ├── admin/              # Admin feature
│   └── blog/               # Blog feature
├── lib/                    # Common libraries
│   ├── prisma.js           # Prisma Client
│   ├── auth.js             # Authentication helper
│   └── middleware.js       # Common middleware
├── views/                  # EJS templates
│   ├── layouts/            # Layouts
│   ├── install/            # Installation screens
│   ├── admin/              # Admin screens
│   └── blog/               # Blog screens
├── public/                 # Static files
├── prisma/                 # Prisma configuration
│   ├── schema.prisma       # Schema definition
│   ├── migrations/         # Migrations
│   └── seed.js             # Seed data
└── app.js                  # Application entry point
```

## Next Steps

1. Database schema design
2. Feature specification
3. Detailed Feature-First structure design
4. Authentication/authorization system design
5. Implementation roadmap
