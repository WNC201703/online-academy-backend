const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *       properties:
 *         fullname:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         active:
 *           type: boolean
 *           description: false -> registered but not verified email
 *         role:
 *           type: string
 *           description: student, teacher, admin
 *         verification_token: 
 *           type: string
 *       example:
 *         fullname: Ho Hieu
 *         email: hieuqqq12597@gmail.com
 *         active: true
 *         role: student
 */



 /**
  * @swagger
  * tags:
  *   name: Users
  *   description: users api
  */



/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: user register -> request body { fullname, email, password }
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: add a user and send verify email
 */

//create a user
router.post('/', asyncHandler(async (req, res, next) => {
  await userService.signUp(req.body);
  return res.status(httpStatus.CREATED).json({ success: true });
})
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Returns the list of all the users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of the users
 */
//get users
router.get('/', auth('admin'), asyncHandler(async (req, res, next) => {
  const users = await userService.getAllUsers();
  return res.status(httpStatus.OK).json(users);
})
);

//get user by id
router.get('/:userId', auth('admin'), asyncHandler(async (req, res, next) => {
  const users = await userService.getUserById(req.params.userId);
  return res.status(httpStatus.OK).json(users);
})
);


/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: user login -> request body { email, password }
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Tu test, luoi tao component qua
 */
router.post('/login', asyncHandler(async (req, res, next) => {
  const {user,accessToken,} = await userService.login(req.body);
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


router.post('/email/verify/send'), asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  await userService.sendVerificationEmail(email);
});

/**
 * @swagger
 * /api/users/email/verify/:token:
 *   post:
 *     summary:  verify email -> params{ token }
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: success
 */
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

/**
 * @swagger
 * /api/users/:userId:
 *   put:
 *     summary:  update user info -> params{ userId }
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: success
 */
router.put('/:userId', auth(), asyncHandler(async (req, res, next) => {
  const user=await userService.updateUserInfo(req.params.userId,req.body);
  return res.status(httpStatus.OK).json({user});
}));

// router.post('/password/reset', auth(), asyncHandler(async (req, res, next) => {
//   const {currentPassword,newPassword}=req.body;
//   const user=await userService.resetPassword(currentPassword,newPassword);
//   return res.status(httpStatus.OK).json({user});
// }));

module.exports = router;
