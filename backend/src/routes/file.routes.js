// File: taskflow-cloud/backend/src/routes/file.routes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  uploadFile,
  getDownloadUrl,
  getFiles,
  deleteFile,
  getMyFiles,
  upload,
} = require('../controllers/file.controller');

// All file routes require authentication
router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);  // POST /api/files/upload
router.get('/my-files', getMyFiles);                        // GET  /api/files/my-files
router.get('/:id/download', getDownloadUrl);                // GET  /api/files/:id/download
router.delete('/:id', deleteFile);                          // DELETE /api/files/:id
router.get('/', getFiles);                                  // GET  /api/files?task_id=xxx

module.exports = router;