// File: taskflow-cloud/backend/src/controllers/project.controller.js
// Purpose: CRUD operations for Projects
// Connects with: database.js (queries), redis.js (caching)

const { query } = require('../config/database');
const { setCache, getCache, deleteCache } = require('../config/redis');

// GET ALL PROJECTS for the logged-in user
// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const cacheKey = `projects:user:${req.user.id}`;
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: { projects: cached }, fromCache: true });
    }

    const result = await query(
      `SELECT p.*, u.name as owner_name,
              COUNT(DISTINCT t.id) as task_count,
              COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as completed_count
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.owner_id = $1
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    // Cache for 5 minutes
    await setCache(cacheKey, result.rows, 300);

    res.json({ success: true, data: { projects: result.rows } });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE PROJECT
// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, u.name as owner_name
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND p.owner_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Get tasks for this project
    const tasksResult = await query(
      `SELECT t.*, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        project: result.rows[0],
        tasks: tasksResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// CREATE PROJECT
// POST /api/projects
// Body: { name, description }
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const result = await query(
      `INSERT INTO projects (name, description, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name.trim(), description || '', req.user.id]
    );

    // Clear projects cache so next request gets fresh data
    await deleteCache(`projects:user:${req.user.id}`);

    res.status(201).json({ success: true, data: { project: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// UPDATE PROJECT
// PUT /api/projects/:id
// Body: { name, description, status }
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND owner_id = $5 
       RETURNING *`,
      [name, description, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await deleteCache(`projects:user:${req.user.id}`);

    res.json({ success: true, data: { project: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// DELETE PROJECT
// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await deleteCache(`projects:user:${req.user.id}`);

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };