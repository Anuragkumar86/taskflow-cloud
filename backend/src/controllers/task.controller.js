// File: taskflow-cloud/backend/src/controllers/task.controller.js
// Purpose: CRUD operations for Tasks within Projects

const { query } = require('../config/database');
const { deleteCache } = require('../config/redis');

// GET ALL TASKS for a project
// GET /api/tasks?project_id=xxx&status=todo&priority=high
const getTasks = async (req, res, next) => {
  try {
    const { project_id, status, priority } = req.query;

    let sql = `
      SELECT t.*, 
             u.name as assigned_to_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.owner_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (project_id) {
      sql += ` AND t.project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }
    if (status) {
      sql += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (priority) {
      sql += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    sql += ' ORDER BY t.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, data: { tasks: result.rows } });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE TASK
// GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const taskResult = await query(
      `SELECT t.*, u.name as assigned_to_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND p.owner_id = $2`,
      [id, req.user.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Get files for this task
    const filesResult = await query(
      'SELECT * FROM files WHERE task_id = $1 ORDER BY created_at DESC',
      [id]
    );

    // Get comments for this task
    const commentsResult = await query(
      `SELECT c.*, u.name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        task: taskResult.rows[0],
        files: filesResult.rows,
        comments: commentsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// CREATE TASK
// POST /api/tasks
// Body: { title, description, priority, deadline, project_id, assigned_to }
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, deadline, project_id, assigned_to } = req.body;

    if (!title || !project_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task title and project_id are required.' 
      });
    }

    // Verify this project belongs to the user
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [project_id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Project not found.' });
    }

    const result = await query(
      `INSERT INTO tasks (title, description, priority, deadline, project_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title.trim(), description || '', priority || 'medium', deadline || null, 
       project_id, assigned_to || null, req.user.id]
    );

    await deleteCache(`projects:user:${req.user.id}`);

    res.status(201).json({ success: true, data: { task: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// UPDATE TASK STATUS (or full update)
// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, deadline, assigned_to } = req.body;

    const result = await query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           deadline = COALESCE($5, deadline),
           assigned_to = COALESCE($6, assigned_to),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, deadline, assigned_to, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: { task: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// DELETE TASK
// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };