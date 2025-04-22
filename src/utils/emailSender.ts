import nodemailer from "nodemailer";
import config from "../config";

export const emailSender = async (email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // this is gmail host.[search it on google]
    port: 587,
    secure: config.nodeEnv === "production",
    auth: {
      user: config.email.email_host,
      pass: config.email.email_password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: '"H & M" <sajjadsajjad098765@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "Reset Password Link", // Subject line
    text: "Reset Password", // plain text body
    html, // html body
  });

  // console.log("Message sent: %s", info.messageId);
};
