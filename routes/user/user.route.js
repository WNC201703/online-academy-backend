const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const userService = require('../../services/user.service');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler')

//create a user
router.post('/', asyncHandler(async (req, res, next) => {
  await userService.signUp(req.body);
  return res.status(httpStatus.CREATED).json({ success: true });
})
);

router.post('/login', asyncHandler(async (req, res, next) => {
  await userService.login(req.body);
  return res.status(httpStatus.OK).json({ success: true });
})
);

router.post('email/verify/send'), asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  await userService.sendVerificationEmail(email);
});


router.get('/email/verify/:token', asyncHandler(async (req, res, next) => {
  const isSuccessful = await userService.verifyUserEmail(req.params.token);
  if (isSuccessful){
    return res.status(httpStatus.OK).json({
      success: true
    });
  }
  else{
    return res.status(httpStatus.BAD_REQUEST).json({
      success:false
    });
  }
   
}));


module.exports = router;
