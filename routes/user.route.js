const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');

//create a user
router.post('/', asyncHandler(async (req, res, next) => {
  await userService.signUp(req.body);
  return res.status(httpStatus.CREATED).json({ success: true });
})
);

//get users
router.get('/', auth('admin'), asyncHandler(async (req, res, next) => {
  const users = await userService.getAllUsers();
  return res.status(httpStatus.OK).json(users);
})
);


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

router.post('email/verify/send'), asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  await userService.sendVerificationEmail(email);
});


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
