const nodemailer = require('nodemailer');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'onlineacademy208@gmail.com',
    pass: '@Onlineacademy208',
  },
});

const sendTokenToCreateAccount = (verificationToken, email) => {
  const mailOptions = {
    from: 'onlineacademy208@gmail.com',
    to: email,
    subject: 'Thư gửi tự động để xác nhận email',
    html: `<p>Vui lòng nhấn vào <a href="${process.env.API_URL}/api/users/email/verify/${verificationToken}">link</a> sau để xác nhận email</p>`,
  };
  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log(err.message);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
  });
};


const sendTokenToUpdateEmail = (verificationToken, email) => {
  const mailOptions = {
    from: 'onlineacademy208@gmail.com',
    to: email,
    subject: 'Thư gửi tự động để xác nhận email',
    html: `<p>Vui lòng nhấn vào <a href="${process.env.API_URL}/api/users/new-email/verify/${verificationToken}">link</a> sau để xác nhận thay đổi email</p>`,
  };
  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log(err.message);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
  });
};



module.exports = { 
  sendTokenToCreateAccount,
  sendTokenToUpdateEmail 
};