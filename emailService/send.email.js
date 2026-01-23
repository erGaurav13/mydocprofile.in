// sendEmail.js

const transporter = require("./email.trasporter");
const EmailTemplate = require("./template");

const sendWelcomeEmail = async ({ to, name }) => {
  try {
    const { subject, html } = EmailTemplate.welcome({ name });

    const info = await transporter.sendMail({
      from: `MyDocProfile Team`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email send failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendWelcomeEmail,
};
