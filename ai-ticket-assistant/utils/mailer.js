import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: Number(process.env.MAILTRAP_SMTP_PORT),
      secure: Number(process.env.MAILTRAP_SMTP_PORT) === 465,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
  }

  return transporter;
};

export const sendMail = async (to, subject, text) =>
  getTransporter().sendMail({
    from: process.env.MAIL_FROM || '"Ticket AI" <no-reply@ticket-ai.local>',
    to,
    subject,
    text,
  });

