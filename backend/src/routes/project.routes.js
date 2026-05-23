// File: taskflow-cloud/backend/src/routes/project.routes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getProjects, getProject, createProject, updateProject, deleteProject
} = require('../controllers/project.controller');

// All project routes require authentication
router.use(authenticateToken);

router.get('/', getProjects);           // GET  /api/projects
router.get('/:id', getProject);         // GET  /api/projects/:id
router.post('/', createProject);        // POST /api/projects
router.put('/:id', updateProject);      // PUT  /api/projects/:id
router.delete('/:id', deleteProject);   // DELETE /api/projects/:id

module.exports = router;