const express = require("express");
const router = express.Router();
const { getHello } = require("../controllers/helloController");

// GET /hello
router.get("/", getHello);

module.exports = router;
