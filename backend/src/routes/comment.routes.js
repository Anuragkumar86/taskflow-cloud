// File: taskflow-cloud/backend/src/routes/comment.routes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { addComment, getComments, deleteComment } = require('../controllers/comment.controller');

router.use(authenticateToken);

router.get('/', getComments);
router.post('/', addComment);
router.delete('/:id', deleteComment);

module.exports = router;