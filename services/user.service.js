const userModel = require("../models/user.model");
const { User } = require("../models/user.model");
const courseModel = require("../models/course.model");
const { Course } = courseModel;
const {Review} = require("../models/review.model");
const {Enrollment} = require("../models/enrollment.model");
const favoriteModel = require("../models/favorite.model");

const mailService = require('./mail.service');
const courseService = require('./course.service');
const {generateAccessToken} = require('./token.service');

const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const { ROLE } = require('../utils/constants');
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
    role: ROLE.STUDENT,
    password: password,
  });
  await user.save();
  return user;
}

async function createTeacher({ email, fullname, password }) {
  if (await userModel.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is taken");
  }
  const user = new User({
    active: true,
    fullname: fullname,
    email: email,
    role: ROLE.TEACHER,
    password: password,
  });
  await user.save();
  return user;
}

async function deleteUser(userId) {
  const user = await userModel.getUserById(userId);
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "Course not found user");
  if (user.role === ROLE.STUDENT) {
    await Review.deleteMany({user:userId});
    console.log('deleted reviews:', user.fullname);
    await Enrollment.deleteMany({student:userId});
    console.log('deleted enrollments:', user.fullname);
    await userModel.deleteUser(userId);
    console.log('deleted user');
  }
  if (user.role === ROLE.TEACHER) {
    const courses = await Course.find({ teacher: userId });

    await Promise.all(courses.map(async (course) => {
      const name = course.name;
      await courseService.deleteCourse(course._id);
      console.log('deleted course:', name);
    }));

    await userModel.deleteUser(userId);
  }
}

async function getAllUsers(role) {
  const users = await userModel.getAllUsers(role);
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
    const accessToken = generateAccessToken(user.email, user._id,user.role);
    const resUser = await User.findById(user._id).select('_id fullname email role');
    return {
      user: resUser,
      accessToken: accessToken
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

async function updateUserInfoByAdmin(userId, body) {
  let user = await userModel.getUserById(userId);
  const { fullname, email, password } = body;
  
  //only allow email update for teacher
  if (email && user.role === ROLE.TEACHER) user.email = email;
  if (fullname) user.fullname = fullname;
  if (password) user.password = password;
  await user.save();
  user = await userModel.getUserById(userId);
  return user;
}

async function resetPassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) throw new ApiError(httpStatus.BAD_REQUEST, "Required currentPassword, newPassword");
  const user = await User.findById(userId);
  const valid = await user.validatePassword(currentPassword);
  if (!valid) throw new ApiError(httpStatus.BAD_REQUEST, "Current password incorrect");
  else {
    user.password = newPassword;
    await user.save();
  }
  return user;
}

async function getFavoriteCourses(userId){
  const favorites=await favoriteModel.getByUserId(userId);
  const results=[];
  favorites.forEach(element => {
    let data = { ...element._doc };
  data.course = element._doc.course._id;
  data['courseName'] = element._doc.course.name;
  results.push(data);
  });
  
  return results;
}
async function favoriteCourse(userId,courseId){
  const favorite=await favoriteModel.get(userId,courseId); 
  if (favorite) return favorite;
  const result=await favoriteModel.add(userId,courseId);
  return result;
}
async function unFavoriteCourse(userId,courseId){
  const result=await favoriteModel.deleteUserFavorite(userId,courseId);
  return result;
}


module.exports = {
  signUp,
  sendVerificationEmail,
  verifyUserEmail,
  login,
  getAllUsers,
  getUserById,
  updateUserInfoByAdmin,
  resetPassword,
  createTeacher,
  deleteUser,
  getFavoriteCourses,
  favoriteCourse,
  unFavoriteCourse,
  // join
}

