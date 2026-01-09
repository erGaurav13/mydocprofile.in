const jwt = require("jsonwebtoken");

const SECRET =
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "change-this-secret";

function createToken(payload, options = {}) {
  const opts = { expiresIn: options.expiresIn || "1h" };
  return jwt.sign(payload, SECRET, opts);
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function safeVerify(token) {
  try {
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}

function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  createToken,
  verifyToken,
  safeVerify,
  decodeToken,
};
  