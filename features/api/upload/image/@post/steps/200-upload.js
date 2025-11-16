import multer from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Configure upload directory
const uploadDir = join(process.cwd(), 'public/uploads')
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true })
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  // Only allow image files
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const mimetype = allowedTypes.test(file.mimetype)
  const extname = allowedTypes.test(file.originalname.toLowerCase())

  if (mimetype && extname) {
    return cb(null, true)
  }
  cb(new Error('Only image files are allowed'))
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export default async (ctx, req, res) => {
  return new Promise((resolve, reject) => {
    const uploadSingle = upload.single('image')

    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: err.message
        })
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        })
      }

      // Save file info to context
      ctx.uploadedFile = {
        filename: req.file.filename,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`
      }

      resolve()
    })
  })
}
