// File: taskflow-cloud/backend/src/controllers/comment.controller.js

const { query } = require('../config/database');

// ADD COMMENT
// POST /api/comments
const addComment = async (req, res, next) => {
  try {
    const { content, task_id } = req.body;

    if (!content || !task_id) {
      return res.status(400).json({ success: false, message: 'Content and task_id are required.' });
    }

    const result = await query(
      `INSERT INTO comments (content, task_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [content.trim(), task_id, req.user.id]
    );

    // Get user name for the response
    const comment = await query(
      `SELECT c.*, u.name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ success: true, data: { comment: comment.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// GET COMMENTS FOR A TASK
// GET /api/comments?task_id=xxx
const getComments = async (req, res, next) => {
  try {
    const { task_id } = req.query;

    const result = await query(
      `SELECT c.*, u.name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [task_id]
    );

    res.json({ success: true, data: { comments: result.rows } });
  } catch (err) {
    next(err);
  }
};

// DELETE COMMENT
// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { addComment, getComments, deleteComment };