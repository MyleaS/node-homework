const express = require("express");
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const userRouter = require("./routes/userRoutes");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes"); // ← ADD THIS
const prisma = require("./db/prisma");

const app = express();

// Global state
global.user_id = null;

// Logging middleware
app.use((req, res, next) => {
  console.log(
    `Method: ${req.method}, Path: ${req.path}, Query: ${JSON.stringify(req.query)}`
  );
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "1kb" }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

app.post("/testpost", (req, res) => {
  res.json({ message: "POST request received at /testpost!" });
});

// User routes (NOT protected)
app.use("/api/users", userRouter);

// Protected task routes
app.use("/api/tasks", authMiddleware, taskRouter);

// Protected analytics routes
app.use("/api/analytics", authMiddleware, analyticsRouter); // ← ADD THIS

// Error handling (keep these LAST)
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
