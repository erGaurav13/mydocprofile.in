const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.secureserver.net",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "support@mydocprofile.in",
//     pass: "mydoc12345", // email account password
//   },
// });

// module.exports = transporter;
// Email send failed: connect ETIMEDOUT 92.204.80.0:587



// const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: "support@mydocprofile.in",
    pass: "mydoc12345", // real mailbox password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;