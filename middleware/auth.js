const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  console.log("Token received:", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret");
    console.log("Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
module.exports = authMiddleware;
