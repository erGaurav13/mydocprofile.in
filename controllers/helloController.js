// Simple controller returning a hello message
exports.getHello = (req, res) => {
  res.json({ message: "Hello, world!" });
};
