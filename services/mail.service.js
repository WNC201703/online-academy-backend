const nodemailer = require('nodemailer');
const ApiError=require('../utils/ApiError');
const httpStatus=require('http-status')

const sendVerificationEmail = (verificationToken, email) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'onlineacademy208@gmail.com',
          pass: '@Onlineacademy208',
        },
      });

    const mailOptions = {
      from: 'onlineacademy208@gmail.com',
      to: email,
      subject: 'Thư gửi tự động để xác nhận email',
      html: `<p>Vui lòng nhấn vào <a href="${process.env.API_URL}/users/email/verify/${verificationToken}">${process.env.API_URL}/users/email/verify/${verificationToken}</a> sau để xác nhận email</p>`,
    };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log(err.message);
            return
          // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
      });
  };

  module.exports={sendVerificationEmail};