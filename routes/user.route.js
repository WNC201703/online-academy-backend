const express = require('express');
const router = express.Router();
const httpStatus = require("http-status");
const asyncHandler = require('../utils/asyncHandler')
const userService = require('../services/user.service');
const tokenService = require('../services/token.service')
const courseService = require('../services/course.service');
const auth = require('../middlewares/auth.mdw');
const {ROLE} = require('../utils/constants')

//create a student
router.post('/', asyncHandler(async (req, res, next) => {
  await userService.signUp(req.body);
  return res.status(httpStatus.CREATED).json({ success: true });
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

//update user info by admin
router.put('/:userId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await userService.updateUserInfoByAdmin(userId, req.body);
  return res.status(httpStatus.OK).json({ user });
}));

//get user by id
router.get('/:userId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  const user = await userService.getUserById(req.params.userId);
  return res.status(httpStatus.OK).json(user);
})
);

//get personal info
router.get('/me/info', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  const user = await userService.getUserById(userId);
  return res.status(httpStatus.OK).json(user);
})
);

router.post('/email/verify/send', asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  console.log(email);
  await userService.sendVerificationEmail(email);
  return res.status(httpStatus.OK).json();
}));

router.get('/email/verify/:token', asyncHandler(async (req, res, next) => {
  const isSuccessful = await userService.verifyUserEmail(req.params.token);
  if (isSuccessful) {
    return res.status(httpStatus.OK).json({
      success: true
    });
  }
  else {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false
    });
  }
}));

router.put('/password/reset', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = tokenService.getPayloadFromRequest(req).userId;
  const user = await userService.resetPassword(userId, currentPassword, newPassword);
  return res.status(httpStatus.OK).json({ user });
}));

router.get('/:userId/enrollments', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  if (userId !== req.params.userId) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
  const enrollments = await courseService.getEnrollmentsByStudentId(userId);
  return res.status(httpStatus.CREATED).json(enrollments);
})
);

router.delete('/:userId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  await userService.deleteUser(userId);
  return res.status(httpStatus.NO_CONTENT).json();
})
);

router.get('/:userId/favorites', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  if (userId !== req.params.userId) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');

  const results = await userService.getFavoriteCourses(userId);
  return res.status(httpStatus.OK).json(results);
})
);

router.put('/:userId/favorites/:courseId', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  if (userId !== req.params.userId) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');

  const courseId = req.params.courseId;
  const result = await userService.favoriteCourse(userId, courseId);
  return res.status(httpStatus.OK).json(result);
})
);

router.delete('/:userId/favorites/:courseId', auth([ROLE.STUDENT]), asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  if (userId !== req.params.userId) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');

  const courseId = req.params.courseId;
  const result = await userService.unFavoriteCourse(userId, courseId);
  return res.status(httpStatus.NO_CONTENT).json();
})
);

module.exports = router;
