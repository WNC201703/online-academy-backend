const express = require('express');
const router = express.Router();
const httpStatus = require("http-status");
const asyncHandler = require('../utils/asyncHandler')
const userService = require('../services/user.service');
const tokenService = require('../services/token.service');
const auth = require('../middlewares/auth.mdw');
const validate = require('../middlewares/validate.mdw');
const userSchema = require('../schemas/user.schema');
const { ROLE } = require('../utils/constants');
const ApiError = require('../utils/ApiError');

router.get('/:userId',
  asyncHandler(async (req, res, next) => {
    const userId = tokenService.getPayloadFromRequest(req).userId;
    const profile=await userService.getTeacherProfile(req.params.userId);
    return res.status(httpStatus.OK).json(profile);
  })
);

router.put('/me',
auth([ROLE.TEACHER]),
validate(userSchema.teacherProfilePUT),
asyncHandler(async (req, res, next) => {
  const userId = tokenService.getPayloadFromRequest(req).userId;
  const profile=await userService.putTeacherProfile(userId,req.body);
  return res.status(httpStatus.OK).json(profile);
})
);



module.exports = router;