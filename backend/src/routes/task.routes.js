// File: taskflow-cloud/backend/src/routes/task.routes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/task.controller');

router.use(authenticateToken);

router.get('/', getTasks);           // GET  /api/tasks
router.get('/:id', getTask);         // GET  /api/tasks/:id
router.post('/', createTask);        // POST /api/tasks
router.put('/:id', updateTask);      // PUT  /api/tasks/:id
router.delete('/:id', deleteTask);   // DELETE /api/tasks/:id

module.exports = router;