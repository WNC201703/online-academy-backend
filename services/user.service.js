const { User } = require("../models/user.model");
const userModel = require("../models/user.model");
const mailService = require('./mail.service');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

const httpStatus = require('http-status')

async function signUp(body) {
  const { email, fullname, password } = body;
  await createUser(email, fullname, password);
  await sendVerificationEmail(email);
}

async function createUser(email, fullname, password) {
  if (await userModel.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is taken");
  }
  const user = new User({
    fullname: fullname,
    email: email,
    role: 'student',
    password: password,
  });
  await user.save();
  return user;
}

async function getAllUsers() {
  const users = await userModel.getAllUsers();
  return users;
}

const sendVerificationEmail = async (email) => {
  const user = await userModel.getUserByEmail(email);
  if (!!user) {
    const verificationToken = require('crypto').randomBytes(48).toString('hex');
    user.verification_token = verificationToken;
    await user.save();
    if (user.verification_token === verificationToken) {
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

async function login(body) {
  const { email, password } = body;
  const user = await userModel.getUserByEmail(email);
  if (!!user) {
    if (!user.active) throw new ApiError(httpStatus.FORBIDDEN, "Email not verified");

    const success = await user.validatePassword(password);
    if (!success) throw new ApiError(httpStatus.UNAUTHORIZED, "Email or password incorrect");
    const accessToken = generateAccessToken(user.email, user._id);

    return {
      user:user,
      accessToken:accessToken
    };

  }
  else {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email not exists");
  }
}

async function getUserById(userId) {
  const user = await userModel.getUserById(userId);
  return user;
}

async function updateUserInfo(userId, body) {
  let user = await userModel.getUserById(userId);
  if (body.email && body.email!=user.email) {
    user.email = body.email;
    user.active = false;
  }
  if (body.fullname) user.fullname = body.fullname;

  await user.save();
  user = await userModel.getUserById(userId);
  if (user.active === false && user.email===body.email)
    await sendVerificationEmail(user.email);
  return user;
}

async function resetPassword(userId,currentPassword,newPassword) {

}


function generateAccessToken(email, id) {
  const payload = {
    email: email,
    userId: id
  }
  return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '86400s' });
}

module.exports = {
  signUp,
  sendVerificationEmail,
  verifyUserEmail,
  login,
  getAllUsers,
  getUserById,
  updateUserInfo,
  resetPassword,
  // join
}

