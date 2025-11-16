# Authentication and Authorization

## Authentication Strategy

### Session-Based Authentication
- Using express-session
- Server-side session storage
- Cookie-based session ID

## Required Packages

```bash
npm install express-session bcrypt
```

## Implementation Details

### 1. Password Hashing (lib/auth.js)

```javascript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
```

### 2. Session Configuration (app.js)

```javascript
import session from 'express-session'

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}))
```

### 3. Authentication Middleware (lib/middleware.js)

```javascript
// Required authentication middleware
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }
  next()
}

// Optional authentication middleware (check login status only)
export async function loadCurrentUser(req, res, next) {
  if (req.session?.userId) {
    req.currentUser = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true
      }
    })

    if (!req.currentUser || !req.currentUser.isActive) {
      req.session.destroy()
      req.currentUser = null
    }
  }

  // Make available in EJS
  res.locals.currentUser = req.currentUser || null

  next()
}

// Admin authorization check
export function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).render('errors/403', {
      message: 'Access denied.'
    })
  }
  next()
}
```

### 4. Login Process

#### Step 1: Render Login Form
```javascript
// features/auth/login/@get/steps/100-render.js
export default async (ctx, req, res) => {
  // Redirect if already logged in
  if (req.session?.userId) {
    return res.redirect('/admin')
  }

  res.render('auth/login', {
    error: null
  })
}
```

#### Step 2: Validate Input
```javascript
// features/auth/login/@post/steps/100-validate.js
export default async (ctx, req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.render('auth/login', {
      error: 'Please enter username and password.'
    })
  }

  ctx.credentials = { username, password }
}
```

#### Step 3: Authenticate
```javascript
// features/auth/login/@post/steps/200-authenticate.js
import { verifyPassword } from '../../../../lib/auth.js'
import { prisma } from '../../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { username, password } = ctx.credentials

  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    return res.render('auth/login', {
      error: 'Invalid username or password.'
    })
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return res.render('auth/login', {
      error: 'Invalid username or password.'
    })
  }

  if (!user.isActive) {
    return res.render('auth/login', {
      error: 'This account has been deactivated.'
    })
  }

  ctx.user = user
}
```

#### Step 4: Create Session
```javascript
// features/auth/login/@post/steps/300-create-session.js
export default async (ctx, req, res) => {
  const { user } = ctx

  // Store user ID in session
  req.session.userId = user.id

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // Redirect to admin page
  res.redirect('/admin')
}
```

### 5. Logout Process

```javascript
// features/auth/logout/@post/steps/100-destroy-session.js
export default async (ctx, req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err)
    }
    res.redirect('/')
  })
}
```

### 6. Create Admin During Installation

```javascript
// features/install/@post/steps/200-create-admin.js
import { hashPassword } from '../../../lib/auth.js'
import { prisma } from '../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { username, email, password, displayName } = ctx.validatedData

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create admin account
  const admin = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      displayName,
      role: 'admin',
      isActive: true
    }
  })

  ctx.admin = admin
}
```

## Security Considerations

### 1. Password Policy

```javascript
// lib/validators.js
export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters.')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters.')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers.')
  }

  return errors
}
```

### 2. CSRF Protection

```javascript
// lib/csrf.js
import crypto from 'crypto'

export function generateCSRFToken(req) {
  const token = crypto.randomBytes(32).toString('hex')
  req.session.csrfToken = token
  return token
}

export function verifyCSRFToken(req, token) {
  return req.session.csrfToken === token
}

// Middleware
export function csrfProtection(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const token = req.body._csrf || req.headers['x-csrf-token']

    if (!verifyCSRFToken(req, token)) {
      return res.status(403).render('errors/403', {
        message: 'Invalid CSRF token.'
      })
    }
  }

  next()
}
```

### 3. Rate Limiting (Login Attempt Limits)

```javascript
// lib/rate-limit.js
const loginAttempts = new Map()

export function checkLoginAttempts(username) {
  const attempts = loginAttempts.get(username) || { count: 0, lastAttempt: Date.now() }

  // Reset after 5 minutes
  if (Date.now() - attempts.lastAttempt > 5 * 60 * 1000) {
    attempts.count = 0
  }

  // Block after 5 attempts
  if (attempts.count >= 5) {
    const remainingTime = 5 * 60 * 1000 - (Date.now() - attempts.lastAttempt)
    return {
      allowed: false,
      remainingTime: Math.ceil(remainingTime / 1000)
    }
  }

  attempts.count++
  attempts.lastAttempt = Date.now()
  loginAttempts.set(username, attempts)

  return { allowed: true }
}

export function resetLoginAttempts(username) {
  loginAttempts.delete(username)
}
```

### 4. Session Security

```javascript
// app.js
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId', // Change default name
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true, // Block JS access
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict' // CSRF protection
  }
}))
```

## Environment Variables

```.env
SESSION_SECRET=your-very-long-random-secret-key-here
```

Generation method:
```bash
# For ESM projects, use one of the following
openssl rand -hex 32

# Or
node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
```

## Permission Levels

### Current Implementation

- **admin**: All permissions (create/edit/delete posts, change settings)

### Future Expansion Possible

- **editor**: Can only create/edit posts
- **viewer**: Read-only access

## Usage in EJS Templates

```ejs
<% if (currentUser) { %>
  <div>Welcome, <%= currentUser.displayName %>!</div>
  <a href="/admin">Admin</a>
  <form action="/auth/logout" method="POST">
    <button>Logout</button>
  </form>
<% } else { %>
  <a href="/auth/login">Login</a>
<% } %>
```

## Next Steps

- Write implementation roadmap
- Start actual implementation
