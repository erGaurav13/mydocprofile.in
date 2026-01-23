// template.js

class EmailTemplate {
  welcome = ({ name }) => {
    return {
      subject: `Welcome to MyDocProfile Family!, ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Hello</h2>
            <p>
              Your MyDocProfile account has been created successfully.
            </p>
            <p>
              If you need any help, feel free to contact our support team.
            </p>
            <br />
            <strong>MyDocProfile Team</strong>
          </body>
        </html>
      `,
    };
  };
}

module.exports = new EmailTemplate();
