import "dotenv/config";
import numflow from "numflow";
import ejs from "ejs";
import session from "express-session";
import methodOverride from "method-override";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { prisma } from "./lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = numflow();
const PORT = process.env.PORT || 5555;
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_NAME = process.env.APP_NAME || "Numflow Blog";

// Enable SQLite Foreign Keys
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')

// Configure EJS view engine
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// Body parser (Express built-in)
app.use(numflow.json());
app.use(numflow.urlencoded({ extended: true }));

// Method Override: Override HTTP method via _method query parameter
app.use(methodOverride('_method'));

// Session configuration
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
}));

// Global middleware: Load current user
app.use(async (req, res, next) => {
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
    });

    if (!req.currentUser || !req.currentUser.isActive) {
      req.session.destroy();
      req.currentUser = null;
    }
  }

  // Make available in EJS templates
  res.locals.currentUser = req.currentUser || null;
  next();
});

// Serve static files from public folder
app.use(numflow.static(join(__dirname, "public")));

// Installation check middleware
app.use(async (req, res, next) => {
  // Skip check for static files, /install, and /auth/login routes
  const staticPaths = ['/css', '/js', '/images', '/fonts', '/install', '/auth/login'];
  if (staticPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  try {
    const installed = await prisma.setting.findUnique({
      where: { key: 'installed' }
    });

    if (!installed || installed.value !== 'true') {
      return res.redirect('/install');
    }

    next();
  } catch (error) {
    console.error('Installation check error:', error);
    return res.redirect('/install');
  }
});

// Feature-First Architecture: Auto-routing based on features folder structure
app.registerFeatures("./features");

// Add address() method for supertest compatibility
if (!app.address) {
  app.address = function() {
    return { port: PORT, address: '127.0.0.1', family: 'IPv4' }
  }
}

// Export app for testing
export default app

// Start server (only when executed directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`📚 Application: ${APP_NAME}`);
    console.log(`🎯 Feature-First Architecture enabled`);
  });
}
