const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: "support@mydocprofile.in",
    pass: "mydoc12345", // email account password
  },
});

module.exports = transporter;
// Email send failed: connect ETIMEDOUT 92.204.80.0:587
