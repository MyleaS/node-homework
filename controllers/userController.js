const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

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

const register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const hashedPassword = await hashPassword(value.password);
  const newUser = {
    name: value.name,
    email: value.email,
    hashedPassword,
    id: Date.now().toString(),
  };
  global.users.push(newUser);
  global.user_id = newUser.id;
  res
    .status(StatusCodes.CREATED)
    .json({ name: newUser.name, email: newUser.email });
};

const logon = async (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find((u) => u.email === email);
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
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET || "your_secret",
    { expiresIn: "1h" }
  );
  res
    .status(StatusCodes.OK)
    .json({ name: user.name, email: user.email, token });
};

const logoff = (req, res) => {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
};

module.exports = { register, logon, logoff };
