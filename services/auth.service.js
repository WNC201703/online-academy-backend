const User = require("../models/user.model");
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const mailService = require('./mail.service')

const userRegister = async (body) => {
  const { email, fullname, password } = body;
  if (await User.emailAlreadyInUse(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is taken");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verify_token = require('crypto').randomBytes(48).toString('hex');


  const inactiveUser = await User.getInactiveAccount(email);
  if (!!inactiveUser) {
    inactiveUser.fullname = fullname;
    inactiveUser.hashPassword = hashPassword;
    inactiveUser.verify_token = verify_token;
    await inactiveUser.save();
  }
  else {
    const newUser = new User({
      fullname: fullname,
      email: email,
      password: hashPassword,
      verify_token: verify_token,
    });
    await newUser.save();
  }
  try {
      mailService.sendVerifyToken(verify_token, email);
  } catch (err) {
    console.log(err.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
}

const verify = async (token) => {
  if (await User.verify(token)) {
  }
  else{
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'expired');
  }
};

module.exports = {
  userRegister,
  verify
}