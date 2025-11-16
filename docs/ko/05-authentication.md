# 인증 및 인가

## 인증 전략

### 세션 기반 인증
- express-session 사용
- 서버 사이드 세션 저장
- 쿠키 기반 세션 ID

## 필수 패키지

```bash
npm install express-session bcrypt
```

## 구현 상세

### 1. 비밀번호 해싱 (lib/auth.js)

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

### 2. 세션 설정 (app.js)

```javascript
import session from 'express-session'

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: 'strict'
  }
}))
```

### 3. 인증 미들웨어 (lib/middleware.js)

```javascript
// 필수 인증 미들웨어
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/auth/login')
  }
  next()
}

// 선택적 인증 미들웨어 (로그인 상태만 확인)
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

  // EJS에서 사용 가능하도록
  res.locals.currentUser = req.currentUser || null

  next()
}

// 관리자 권한 확인
export function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).render('errors/403', {
      message: '접근 권한이 없습니다.'
    })
  }
  next()
}
```

### 4. 로그인 프로세스

#### Step 1: 로그인 폼 렌더링
```javascript
// features/auth/login/@get/steps/100-render.js
export default async (ctx, req, res) => {
  // 이미 로그인한 경우 리다이렉트
  if (req.session?.userId) {
    return res.redirect('/admin')
  }

  res.render('auth/login', {
    error: null
  })
}
```

#### Step 2: 입력 검증
```javascript
// features/auth/login/@post/steps/100-validate.js
export default async (ctx, req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.render('auth/login', {
      error: '사용자명과 비밀번호를 입력해주세요.'
    })
  }

  ctx.credentials = { username, password }
}
```

#### Step 3: 인증
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
      error: '잘못된 사용자명 또는 비밀번호입니다.'
    })
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return res.render('auth/login', {
      error: '잘못된 사용자명 또는 비밀번호입니다.'
    })
  }

  if (!user.isActive) {
    return res.render('auth/login', {
      error: '이 계정은 비활성화되었습니다.'
    })
  }

  ctx.user = user
}
```

#### Step 4: 세션 생성
```javascript
// features/auth/login/@post/steps/300-create-session.js
export default async (ctx, req, res) => {
  const { user } = ctx

  // 세션에 사용자 ID 저장
  req.session.userId = user.id

  // 마지막 로그인 시간 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // 관리자 페이지로 리다이렉트
  res.redirect('/admin')
}
```

### 5. 로그아웃 프로세스

```javascript
// features/auth/logout/@post/steps/100-destroy-session.js
export default async (ctx, req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 파기 오류:', err)
    }
    res.redirect('/')
  })
}
```

### 6. 설치 중 관리자 생성

```javascript
// features/install/@post/steps/200-create-admin.js
import { hashPassword } from '../../../lib/auth.js'
import { prisma } from '../../../lib/prisma.js'

export default async (ctx, req, res) => {
  const { username, email, password, displayName } = ctx.validatedData

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password)

  // 관리자 계정 생성
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

## 보안 고려사항

### 1. 비밀번호 정책

```javascript
// lib/validators.js
export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호에 소문자가 포함되어야 합니다.')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호에 대문자가 포함되어야 합니다.')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호에 숫자가 포함되어야 합니다.')
  }

  return errors
}
```

### 2. CSRF 보호

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

// 미들웨어
export function csrfProtection(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const token = req.body._csrf || req.headers['x-csrf-token']

    if (!verifyCSRFToken(req, token)) {
      return res.status(403).render('errors/403', {
        message: '유효하지 않은 CSRF 토큰입니다.'
      })
    }
  }

  next()
}
```

### 3. 비율 제한 (로그인 시도 제한)

```javascript
// lib/rate-limit.js
const loginAttempts = new Map()

export function checkLoginAttempts(username) {
  const attempts = loginAttempts.get(username) || { count: 0, lastAttempt: Date.now() }

  // 5분 후 리셋
  if (Date.now() - attempts.lastAttempt > 5 * 60 * 1000) {
    attempts.count = 0
  }

  // 5회 시도 후 차단
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

### 4. 세션 보안

```javascript
// app.js
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId', // 기본 이름 변경
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS만
    httpOnly: true, // JS 접근 차단
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict' // CSRF 보호
  }
}))
```

## 환경 변수

```.env
SESSION_SECRET=your-very-long-random-secret-key-here
```

생성 방법:
```bash
# ESM 프로젝트의 경우 다음 중 하나 사용
openssl rand -hex 32

# 또는
node --input-type=module -e "import crypto from 'crypto'; console.log(crypto.randomBytes(32).toString('hex'))"
```

## 권한 수준

### 현재 구현

- **admin**: 모든 권한 (게시물 작성/수정/삭제, 설정 변경)

### 향후 확장 가능

- **editor**: 게시물 작성/수정만 가능
- **viewer**: 읽기 전용 접근

## EJS 템플릿에서 사용

```ejs
<% if (currentUser) { %>
  <div>환영합니다, <%= currentUser.displayName %>님!</div>
  <a href="/admin">관리자</a>
  <form action="/auth/logout" method="POST">
    <button>로그아웃</button>
  </form>
<% } else { %>
  <a href="/auth/login">로그인</a>
<% } %>
```

## 다음 단계

- 구현 로드맵 작성
- 실제 구현 시작
