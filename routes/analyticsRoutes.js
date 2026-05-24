// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/users", analyticsController.getUsersWithStats);
router.get("/users/:id", analyticsController.getUserAnalytics);
router.get("/tasks/search", analyticsController.searchTasks);

module.exports = router;
