const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

exports.create = (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const newTask = {
    ...value,
    id: taskCounter(),
    userId: global.user_id,
  };
  global.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  return res.status(StatusCodes.CREATED).json(sanitizedTask);
};

exports.index = (req, res) => {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id
  );
  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });
  if (sanitizedTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found for this user." });
  }
  return res.json(sanitizedTasks);
};

exports.show = (req, res) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id
  );
  if (!task) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  const { userId, ...sanitizedTask } = task;
  return res.json(sanitizedTask);
};

exports.update = (req, res) => {
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
  const currentTask = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id
  );
  if (!currentTask) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  Object.assign(currentTask, value);
  const { userId, ...sanitizedTask } = currentTask;
  return res.json(sanitizedTask);
};

exports.deleteTask = (req, res) => {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskId && task.userId === global.user_id
  );
  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  const { userId, ...deletedTask } = global.tasks[taskIndex];
  global.tasks.splice(taskIndex, 1);
  return res.json(deletedTask);
};
