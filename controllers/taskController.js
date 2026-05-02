const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

exports.create = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted ?? false, global.user_id]
  );
  return res.status(StatusCodes.CREATED).json(task.rows[0]);
};

exports.index = async (req, res) => {
  const tasks = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id]
  );
  if (tasks.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "No tasks found for this user." });
  }
  return res.json(tasks.rows);
};

exports.show = async (req, res) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid." });
  }
  const task = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, global.user_id]
  );
  if (task.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "That task was not found" });
  }
  return res.json(task.rows[0]);
};

exports.update = async (req, res) => {
  if (!req.body) req.body = {};
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid." });
  }
  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  let keys = Object.keys(value);
  keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
  const values = Object.values(value);
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...values, taskId, global.user_id]
  );
  if (updatedTask.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "That task was not found" });
  }
  return res.json(updatedTask.rows[0]);
};

exports.deleteTask = async (req, res) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid." });
  }
  const deletedTask = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
    [taskId, global.user_id]
  );
  if (deletedTask.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "That task was not found" });
  }
  return res.json(deletedTask.rows[0]);
};
