const express = require('express');
const router = express.Router();
const httpStatus = require("http-status");
const asyncHandler = require('../utils/asyncHandler')
const userService = require('../services/user.service');
const tokenService = require('../services/token.service');
const courseService = require('../services/course.service');
const auth = require('../middlewares/auth.mdw');
const { ROLE,VERIFY_TOKEN_TYPE } = require('../utils/constants');
const ApiError = require('../utils/ApiError');

//create a student
router.post('/', asyncHandler(async (req, res, next) => {
  await userService.signUp(req.body);
  return res.status(httpStatus.CREATED).json({ success: true,message:'A verification email has been sent to email' });
})
);

//create a teacher
router.post('/teacher', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  await userService.createTeacher(req.body);
  return res.status(httpStatus.CREATED).json({ success: true });
})
);

//get users
router.get('/', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  const { role } = req.query;
  const users = await userService.getAllUsers(role);
  return res.status(httpStatus.OK).json(users);
})
);

router.post('/login', asyncHandler(async (req, res, next) => {
  const { user, accessToken, } = await userService.login(req.body);
  if (!!accessToken)
    return res.status(httpStatus.OK).json({
      authenticated: true,
      user,
      accessToken,
    });
  else
    return res.status(httpStatus.UNAUTHORIZED).json({ authenticated: false, });
})
);

//update user info 
router.put('/:userId', auth(), asyncHandler(async (req, res, next) => {
  const role = tokenService.getPayloadFromRequest(req).role;
  if (role === ROLE.ADMIN) {
    const {userId}= req.params;
    const user = await userService.updateUserInfoByAdmin(userId, req.body);
    return res.status(httpStatus.OK).json({ user });
  }
  else {
    //........
    //........
    //........
    //........
    //........
    //........
  }
}));

//get user by id
router.get('/:userId', auth(), asyncHandler(async (req, res, next) => {
  const role = tokenService.getPayloadFromRequest(req).role;
  const idAdmin = role === ROLE.ADMIN;
  const userId = userService.parseUserId(req, idAdmin);
  const user = await userService.getUserById(userId);
  return res.status(httpStatus.OK).json(user);
})
);

// //get personal info
// router.get('/me/info', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
//   const userId = tokenService.getPayloadFromRequest(req).userId;
//   const user = await userService.getUserById(userId);
//   return res.status(httpStatus.OK).json(user);
// })
// );

router.post('/email/verify/send', asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  console.log(email);
  await userService.sendVerificationEmail(email);
  return res.status(httpStatus.OK).json();
}));

router.get('/email/verify/:token', asyncHandler(async (req, res, next) => {
  const user = await userService.verifyUserEmail(req.params.token);
  if (user) {
    return res.status(httpStatus.OK).json({
      message:'Your account has been successfully verified',
      ...user
    });
  }
  else {
    return res.status(httpStatus.BAD_REQUEST).json({
     error_message:'Your verification link may have expired. Please click on resend for verify your Email#2'
    });
  }
}));

router.get('/new-email/verify/:token', asyncHandler(async (req, res, next) => {
  const isSuccessful = await userService.verifyUserEmail(req.params.token);
  if (isSuccessful) {
    return res.status(httpStatus.OK).json({
      message:'Your new email has been successfully verified, please login with new email'
    });
  }
  else {
    return res.status(httpStatus.BAD_REQUEST).json({
      error_message:'Your verification link may have expired. Please click on resend for verify your Email#2'
    });
  }
}));

router.put('/:userId/password/reset', auth(), asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = userService.parseUserId(req, false);
  const user = await userService.resetPassword(userId, currentPassword, newPassword);
  return res.status(httpStatus.OK).json({ user });
}));

router.put('/:userId/email', auth(), asyncHandler(async (req, res, next) => {
  const { currentPassword,newEmail} = req.body;
  const userId = userService.parseUserId(req, false);
  await userService.updateEmail(userId, currentPassword, newEmail);
  return res.status(httpStatus.OK).json({message: 'A verification email has been sent to new email'});
}));

//get enrollments
router.get('/:userId/courses', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const enrollments = await courseService.getEnrollmentsByStudentId(userId);
  return res.status(httpStatus.OK).json(enrollments);
})
);

//get posted courses
router.get('/:userId/posted-courses', auth([ROLE.TEACHER]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const enrollments = await courseService.getPostedCourses(userId);
  return res.status(httpStatus.CREATED).json(enrollments);
})
);

router.delete('/:userId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  await userService.deleteUser(userId);
  return res.status(httpStatus.NO_CONTENT).json();
})
);

router.get('/:userId/favorites', auth([ROLE.STUDENT,ROLE.TEACHER]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const results = await userService.getFavoriteCourses(userId);
  return res.status(httpStatus.OK).json(results);
})
);

router.put('/:userId/favorites/:courseId', auth([ROLE.STUDENT,ROLE.TEACHER]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const courseId = req.params.courseId;
  const result = await userService.favoriteCourse(userId, courseId);
  return res.status(httpStatus.OK).json(result);
})
);

router.delete('/:userId/favorites/:courseId', auth([ROLE.STUDENT,ROLE.TEACHER]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const courseId = req.params.courseId;
  const result = await userService.unFavoriteCourse(userId, courseId);
  return res.status(httpStatus.NO_CONTENT).json();
})
);

router.get('/:userId/favorites', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const results = await userService.getFavoriteCourses(userId);
  return res.status(httpStatus.OK).json(results);
})
);


router.get('/:userId/courses/:courseId/completed-lesson', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const courseId = req.params.courseId;
  const results=await userService.getCompletedLessons(userId, courseId);
  return res.status(httpStatus.OK).json(results);
})
);


router.post('/:userId/courses/:courseId/completed-lesson', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const courseId = req.params.courseId;
  const lessonId = req.body.lessonId;
  if (!lessonId) throw new ApiError(httpStatus.BAD_REQUEST,'lessonId is required');
  await userService.completedLesson(userId, courseId, lessonId);
  return res.status(httpStatus.CREATED).json();
})
);

router.delete('/:userId/courses/:courseId/completed-lesson', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = userService.parseUserId(req, false);
  const courseId = req.params.courseId;
  const lessonId = req.body.lessonId;
  if (!lessonId) throw new ApiError(httpStatus.BAD_REQUEST,'lessonId is required');
  await userService.deleteCompletedLesson(userId, courseId,lessonId);
  return res.status(httpStatus.NO_CONTENT).json();
})
);

module.exports = router;
