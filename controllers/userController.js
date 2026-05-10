const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res, next) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const hashedPassword = await hashPassword(value.password);
  let user = null;
  try {
    user = await prisma.user.create({
      data: { name: value.name, email: value.email, hashedPassword },
      select: { id: true, name: true, email: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email is already registered." });
    }
    return next(err);
  }
  global.user_id = user.id;
  return res
    .status(StatusCodes.CREATED)
    .json({ name: user.name, email: user.email });
};

const logon = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Failed" });
    }
    const match = await comparePassword(password, user.hashedPassword);
    if (!match) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Failed" });
    }
    global.user_id = user.id;
    const token = jwt.sign(
      { id: user.id, name: user.name }, // CHANGED: userId -> id
      process.env.JWT_SECRET || "your_secret",
      { expiresIn: "1h" }
    );
    return res
      .status(StatusCodes.OK)
      .json({ name: user.name, email: user.email, token });
  } catch (err) {
    next(err);
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
};

module.exports = { register, logon, logoff };
