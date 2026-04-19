const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

router.get("/dogs", (req, res) => {
  res.json(dogs);
});

router.post("/adopt", (req, res, next) => {
  try {
    const { name, address, email, dogName } = req.body;

    if (!name || !email || !dogName) {
      throw new ValidationError("Missing required fields: name, email, and dogName are required");
    }

    const dog = dogs.find(d => d.name.toLowerCase() === dogName.toLowerCase());
    if (!dog || dog.status !== 'available') {
      throw new NotFoundError(`${dogName} not found or not available`);
    }

    return res.status(201).json({
      message: `Adoption request received. We will contact you at ${email} for further details.`,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/error", (req, res) => {
  throw new Error("Test error");
});

module.exports = router;
