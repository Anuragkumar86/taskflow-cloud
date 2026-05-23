// File: taskflow-cloud/backend/src/controllers/file.controller.js
// Purpose: Upload files — uses local disk in development, AWS S3 in production
// Why two modes: So you can test the full flow without AWS credentials

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// ─── Determine Storage Mode ──────────────────────────────────────────────────
// If AWS credentials (key+secret+bucket+region) are present → use S3
// If any required AWS var is missing → fall back to local disk (development)
const hasAwsKey = !!process.env.AWS_ACCESS_KEY_ID;
const hasAwsSecret = !!process.env.AWS_SECRET_ACCESS_KEY;
const hasAwsBucket = !!process.env.AWS_S3_BUCKET_NAME;
const hasAwsRegion = !!process.env.AWS_REGION;
const useS3 = hasAwsKey && hasAwsSecret && hasAwsBucket && hasAwsRegion;

if (useS3) {
  console.log('[FILE_UPLOAD] Storage mode: AWS S3');
} else {
  console.log('[FILE_UPLOAD] Storage mode: Local Disk — missing AWS config: ', {
    AWS_ACCESS_KEY_ID: hasAwsKey,
    AWS_SECRET_ACCESS_KEY: hasAwsSecret,
    AWS_S3_BUCKET_NAME: hasAwsBucket,
    AWS_REGION: hasAwsRegion,
  });
}

// ─── S3 Client (only used when useS3 = true) ─────────────────────────────────
let s3Client = null;
if (useS3) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    // In production (EC2 with IAM role), credentials come from the role automatically
    // In local dev, credentials come from .env
    ...(process.env.NODE_ENV !== 'production' && {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }),
  });
}

// ─── Local Storage Setup (development only) ──────────────────────────────────
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');
// Create uploads folder if it doesn't exist
if (!useS3 && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

// ─── Multer Config (memory storage for S3, disk for local) ───────────────────
const storage = useS3
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, LOCAL_UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

// ─── Upload File ──────────────────────────────────────────────────────────────
// POST /api/files/upload
// Form data: { file: <binary>, task_id: <uuid> }
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }
    const { task_id } = req.body;
    if (!task_id) {
      return res.status(400).json({ success: false, message: 'task_id is required.' });
    }

    let fileUrl = '';
    let storedFilename = '';

    if (useS3) {
      // ── Upload to AWS S3 ──────────────────────────────────────────────────
      const ext = path.extname(req.file.originalname);
      storedFilename = `tasks/${task_id}/${uuidv4()}${ext}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: storedFilename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'original-name': Buffer.from(req.file.originalname).toString('base64'),
          'uploaded-by': req.user.id,
          'task-id': task_id,
        },
      });

      try {
        await s3Client.send(uploadCommand);

        fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${storedFilename}`;
        console.log(`[S3_UPLOAD] ✅ Uploaded to S3: ${storedFilename}`);
      } catch (s3err) {
        console.error('[S3_UPLOAD_ERROR] Failed to upload to S3:', s3err.message);
        // Provide a helpful error to the client
        return res.status(502).json({
          success: false,
          message: 'Failed to upload file to S3. Check server logs for details.',
          error: s3err.message,
        });
      }

    } else {
      // ── Save to Local Disk (development fallback) ─────────────────────────
      storedFilename = req.file.filename;
      fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${storedFilename}`;
      console.log(`[LOCAL_UPLOAD] ✅ Saved to disk: ${storedFilename}`);
    }

    // Save file METADATA to the database (not the actual file)
    // The actual file lives in S3 or on disk. DB only has the URL and info.
    const result = await query(
      `INSERT INTO files (filename, original_name, file_url, file_size, mime_type, task_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        storedFilename,
        req.file.originalname,
        fileUrl,
        req.file.size,
        req.file.mimetype,
        task_id,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: `File uploaded successfully to ${useS3 ? 'AWS S3' : 'local storage'}.`,
      data: {
        file: result.rows[0],
        storage: useS3 ? 's3' : 'local',
      },
    });
  } catch (err) {
    console.error('[UPLOAD_ERROR]', err.message);
    next(err);
  }
};

// ─── Get Download URL ─────────────────────────────────────────────────────────
// GET /api/files/:id/download
// Returns a secure URL to download the file
// For S3: generates a temporary signed URL (valid 1 hour)
// For local: returns direct URL
const getDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }
    const file = result.rows[0];

    if (useS3) {
      // Generate a temporary signed URL — valid for 1 hour
      // This is secure: the file is private in S3, only accessible via this URL
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.filename,
        ResponseContentDisposition: `attachment; filename="${file.original_name}"`,
      });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return res.json({
        success: true,
        data: {
          download_url: signedUrl,
          expires_in: '1 hour',
          storage: 's3',
        },
      });
    } else {
      // Local file — return direct URL
      return res.json({
        success: true,
        data: {
          download_url: file.file_url,
          storage: 'local',
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

// ─── Get Files for a Task ─────────────────────────────────────────────────────
// GET /api/files?task_id=xxx
const getFiles = async (req, res, next) => {
  try {
    const { task_id } = req.query;
    if (!task_id) {
      return res.status(400).json({ success: false, message: 'task_id is required.' });
    }

    const result = await query(
      `SELECT f.*, u.name as uploaded_by_name
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.task_id = $1
       ORDER BY f.created_at DESC`,
      [task_id]
    );

    res.json({ success: true, data: { files: result.rows } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete File ──────────────────────────────────────────────────────────────
// DELETE /api/files/:id
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get file info first
    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND uploaded_by = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const file = result.rows[0];

    if (useS3) {
      // Delete from S3
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: file.filename,
        });
        await s3Client.send(deleteCommand);
        console.log(`[S3_DELETE] Deleted: ${file.filename}`);
      } catch (s3err) {
        console.error('[S3_DELETE_ERROR] Failed to delete from S3:', s3err.message);
        return res.status(502).json({ success: false, message: 'Failed to delete file from S3', error: s3err.message });
      }
    } else {
      // Delete from local disk
      const localPath = path.join(LOCAL_UPLOAD_DIR, file.filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    // Delete from database
    await query('DELETE FROM files WHERE id = $1', [id]);

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Files Uploaded by Current User ───────────────────────────────────
// GET /api/files/my-files
const getMyFiles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, t.title as task_title, p.name as project_name
       FROM files f
       LEFT JOIN tasks t ON f.task_id = t.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE f.uploaded_by = $1
       ORDER BY f.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ success: true, data: { files: result.rows } });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile, getDownloadUrl, getFiles, deleteFile, getMyFiles, upload };