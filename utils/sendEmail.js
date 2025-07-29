// utils/sendEmail.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'esuwo2024@gmail.com',          
    pass: 'zqfw sogd vsxx gywp'              
  },
});
const sendEmail = (to, subject, htmlContent) => {
  const mailOptions = {
    from: '"Lost and Found" <esuwo2024@gmail.com>',
    to,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions)
    .then(info => {
      console.log('Email sent: ' + info.response);
      return info;
    })
    .catch(error => {
      console.error('Error sending email: ', error);
      throw new Error('Failed to send OTP email.');
    });
};



module.exports = sendEmail;
