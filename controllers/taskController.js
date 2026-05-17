const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

// Helper: build orderBy from query params
const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  return validSortFields.includes(sortBy)
    ? { [sortBy]: sortDirection }
    : { createdAt: "desc" };
};

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
        priority: value.priority ?? "medium",
        userId: userId,
      },
      select: { id: true, title: true, isCompleted: true, priority: true },
    });
    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    return next(err);
  }
};

exports.index = async (req, res, next) => {
  const userId = req.user?.id ?? global.user_id;
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build where clause with optional search filter
    const whereClause = { userId };
    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const [tasks, totalTasks] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          isCompleted: true,
          priority: true,
          createdAt: true,
          User: { select: { name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: getOrderBy(req.query),
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(totalTasks / limit);
    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages,
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(StatusCodes.OK).json({ tasks, pagination });
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
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: { select: { name: true, email: true } },
      },
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

// POST /api/tasks/bulk — bulk create tasks
exports.bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;
  const userId = req.user?.id ?? global.user_id;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid request data. Expected an array of tasks." });
  }

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task, { abortEarly: false });
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Validation failed", details: error.details });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted ?? false,
      priority: value.priority ?? "medium",
      userId: userId,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });
    return res.status(StatusCodes.CREATED).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
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
      select: { id: true, title: true, isCompleted: true, priority: true },
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
      select: { id: true, title: true, isCompleted: true, priority: true },
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
