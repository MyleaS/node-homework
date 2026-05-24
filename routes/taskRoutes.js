// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.get("/", taskController.index);
router.post("/bulk", taskController.bulkCreate); // ← BEFORE /:id
router.get("/:id", taskController.show);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask); // ← deleteTask not destroy

module.exports = router;
