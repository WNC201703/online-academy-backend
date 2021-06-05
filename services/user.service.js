const {User} = require("../models/user.model");
const userModel= require("../models/user.model");
const mailService =require('./mail.service');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

const httpStatus = require('http-status')

async function signUp(body){
  const { email, fullname, password } = body;
  await createUser(email,fullname,password);
  await sendVerificationEmail(email);
}

async function createUser(email, fullname, password)  {
  if (await userModel.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is taken");
  }
  const user = new User({
    fullname: fullname,
    email: email,
    password: password,
  });
  await user.save();
  return user;
}

const sendVerificationEmail = async (email) => {
  const user = await userModel.getUserByEmail(email);
  if (!!user) {
    const verificationToken = require('crypto').randomBytes(48).toString('hex');
    user.verification_token=verificationToken;
    await user.save();
    if (user.verification_token===verificationToken){
      try {
        mailService.sendVerificationEmail(verificationToken, email);
      } catch (err) {
        console.log(err.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
      }
    } else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'ERROR');
  }
  else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email not exists");
  }
}

const verifyUserEmail = async (token) => {
  const user = await User.findOne({ verification_token: token });

  if (!!user) {
    user.active = true;
    user.verification_token = '';
    await user.save();
    if (user.active) return true;
  }
  else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'expired');
  }
  return false;
};

const login = async (body) => {
  const { email, password } = body;
  const user = await userModel.getUserByEmail(email);
  if (!!user) {
    if (!user.active) throw new ApiError(httpStatus.FORBIDDEN, "Email not verified");

    const success=await user.validatePassword(password);
    if  (!success) throw new ApiError(httpStatus.UNAUTHORIZED, "Email or password incorrect");

    const payload = {
      email: user.email
    }
    const opts = {
      expiresIn: 300 * 60 // seconds
    }
    const accessToken = jwt.sign(payload, 'online-academy-secret-key', opts);
    return accessToken;
    // if (user.active == false) throw new ApiError(httpStatus.FORBIDDEN, "Email not verified");
  }
  else {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email not exists");
  }
}

module.exports = {
  signUp,
  sendVerificationEmail,
  verifyUserEmail,
  login,
}