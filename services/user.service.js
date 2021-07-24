const userModel = require("../models/user.model");
const courseModel = require("../models/course.model");
const { User } = require("../models/user.model");
const { Course } = courseModel;
const { Review } = require("../models/review.model");
const { Enrollment } = require("../models/enrollment.model");
const favoriteModel = require("../models/favorite.model");
const enrollmentModel = require("../models/enrollment.model");
const completedLessonModel = require("../models/completedLesson.model");
const tokenModel = require("../models/token.model");
const { Token } = tokenModel;
const tokenService = require('../services/token.service');
const mailService = require('./mail.service');
const courseService = require('./course.service');
const { generateAccessToken } = require('./token.service');
const ApiError = require('../utils/ApiError');
const { ROLE, VERIFY_TOKEN_TYPE } = require('../utils/constants');
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
    await Review.deleteMany({ user: userId });
    console.log('deleted reviews:', user.fullname);
    await Enrollment.deleteMany({ student: userId });
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

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'We were unable to find a user with that email. Make sure your Email is correct!');

  if (user.active) throw new ApiError(httpStatus.OK, 'This account has been already verified. Please log in.');
  else {
    const verificationToken = require('crypto').randomBytes(48).toString('hex');

    const token = await tokenModel.addTokenForSignUp(user._id, verificationToken);
    if (token.token === verificationToken) {
      try {
        mailService.sendTokenToCreateAccount(verificationToken, email);
      } catch (err) {
        console.log(err.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
      }
    } else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'ERROR');
  }
}

const sendVerificationForNewEmail = async (userId,newEmail) => {
  const user = await userModel.getUserByEmail(newEmail);

  if (user) throw new ApiError(httpStatus.BAD_REQUEST, 'Email is taken');

  else {
    const verificationToken = require('crypto').randomBytes(48).toString('hex');

    const token = await tokenModel.addTokenForEmailUpdate(userId, verificationToken, newEmail);
    if (token.token === verificationToken) {
      try {
        mailService.sendTokenToUpdateEmail(verificationToken, newEmail);
      } catch (err) {
        console.log(err.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
      }
    } else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'SOMETHING WENT WRONG');
  }
}

const verifyUserEmail = async (token) => {

  const vrToken = await Token.findOne({ token: token });
  if (!vrToken) throw new ApiError(httpStatus.UNAUTHORIZED, 'Your verification link may have expired. Please click on resend for verify your Email.');
  console.log(token.type);
  if (vrToken.type === VERIFY_TOKEN_TYPE.SIGN_UP) {

    const user = await User.findOne({ _id: vrToken.user });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'We were unable to find a user for this verification. Please SignUp!');

    if (user.active) throw new ApiError(httpStatus.OK, 'User has been already verified. Please Login');
    else {
      user.active = true;
      await user.save();
    }
    return true;

  }

  if (vrToken.type===VERIFY_TOKEN_TYPE.CHANGE_EMAIL){
    const newEmail=vrToken.newEmail;
    const user = await User.findOne({ _id: vrToken.user });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'We were unable to find a user for this verification.!');

    user.email=newEmail;
    await user.save();

    return true;
  }
};

async function login(body) {
  const { email, password } = body;
  const user = await userModel.getUserByEmail(email);
  if (!!user) {
    if (!user.active) throw new ApiError(httpStatus.FORBIDDEN, "Email not verified");

    const success = await user.validatePassword(password);
    if (!success) throw new ApiError(httpStatus.UNAUTHORIZED, "Email or password incorrect");
    const accessToken = generateAccessToken(user.email, user._id, user.role);
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

async function updateEmail(userId, currentPassword, newEmail) {
  const user = await User.findById(userId);
  if (user.email===newEmail) throw new ApiError(httpStatus.BAD_REQUEST, "Email not valid");
  const valid = await user.validatePassword(currentPassword);
  if (!valid) throw new ApiError(httpStatus.BAD_REQUEST, "Current password incorrect");
  else {
    await sendVerificationForNewEmail(userId,newEmail);
  }
}


async function getFavoriteCourses(userId) {
  const favorites = await favoriteModel.getByUserId(userId);
  const results=await courseService.getCoursesByIdList(favorites.map(item => item.course));
  return results;
}
async function favoriteCourse(userId, courseId) {
  const favorite = await favoriteModel.get(userId, courseId);
  if (favorite) return favorite;
  const result = await favoriteModel.add(userId, courseId);
  return result;
}
async function unFavoriteCourse(userId, courseId) {
  const result = await favoriteModel.deleteUserFavorite(userId, courseId);
  return result;
}

async function getCompletedLessons(userId, courseId) {
  const erm = await enrollmentModel.exists(courseId, userId);
  if (!erm) throw new ApiError(httpStatus.BAD_REQUEST, '');

  const completedLessons = await completedLessonModel.get(userId, courseId);
  return completedLessons.map((item) => item.lesson);
}

async function completedLesson(userId, courseId, lessonId) {
  const completed = await completedLessonModel.exists(userId, courseId, lessonId);
  if (completed) return completed;
  const result = await completedLessonModel.add(userId, courseId, lessonId);
  return result;
}
async function deleteCompletedLesson(userId, courseId, lessonId) {
  const result = await completedLessonModel.deleteCompletedLesson(userId, courseId, lessonId);
  console.log(result);
  return result;
}

function parseUserId(request, isAdmin) {
  const paramUserId = request.params.userId;
  const decodedUserId = tokenService.getPayloadFromRequest(request).userId;
  //return user id by bearer token 
  if (paramUserId === 'me') {
    return decodedUserId;
  }
  //if not admin => recheck paramId and decoded id
  if (!isAdmin) {
    if (decodedUserId != paramUserId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Access Denied');
  }

  return paramUserId;
}
module.exports = {
  parseUserId,

  signUp,
  sendVerificationEmail,
  verifyUserEmail,
  login,
  getAllUsers,
  getUserById,
  updateUserInfoByAdmin,
  resetPassword,
  updateEmail,
  createTeacher,
  deleteUser,

  getFavoriteCourses,
  favoriteCourse,
  unFavoriteCourse,

  getCompletedLessons,
  completedLesson,
  deleteCompletedLesson,

  // join
}

