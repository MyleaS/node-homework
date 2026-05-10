const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

exports.create = async (req, res, next) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const userId = req.user?.id ?? global.user_id;
  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted ?? false,
        userId: userId,
      },
      select: { id: true, title: true, isCompleted: true },
    });
    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    return next(err);
  }
};

exports.index = async (req, res, next) => {
  const userId = req.user?.id ?? global.user_id;
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      select: { id: true, title: true, isCompleted: true },
    });
    // REVERTED: tests expect 404 when no tasks found
    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No tasks found for this user." });
    }
    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
};

exports.show = async (req, res, next) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const userId = req.user?.id ?? global.user_id;
  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: userId,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });
    if (!task) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found" });
    }
    return res.json(task);
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  if (!req.body) req.body = {};
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const userId = req.user?.id ?? global.user_id;
  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id: taskId,
          userId: userId,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });
    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found" });
    }
    return next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const userId = req.user?.id ?? global.user_id;
  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: userId,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });
    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found" });
    }
    return next(err);
  }
};
