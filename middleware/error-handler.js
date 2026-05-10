const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  // ADDED: Prisma connection error check
  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
    if (!res.headersSent) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Database connection failed." });
    }
  }

  // Existing pg connection error check
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log(
      "The database connection was refused. Is your database service running?"
    );
  }

  console.error(
    "Internal server error: ",
    err.constructor.name,
    JSON.stringify(err, ["name", "message", "stack"])
  );

  if (!res.headersSent) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An internal server error occurred.");
  }
};

module.exports = errorHandlerMiddleware;
