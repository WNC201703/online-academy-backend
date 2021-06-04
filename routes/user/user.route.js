const express = require('express');
const httpStatus = require("http-status");

const router = express.Router();
const authService = require('../../services/auth.service');
const asyncHandler = require('../../utils/asyncHandler')

//create a user
router.post('/', asyncHandler(async (req, res, next) => {
  await authService.userRegister(req.body);
  return res.status(httpStatus.OK).json({ success: 'Đã gửi mail xác nhận thành công' });
})
);

router.get('/verify/:token', asyncHandler(async (req, res, next) => {
  await authService.verify(req.params.token);
  return res.status(httpStatus.CREATED).json({ success:true});
}));


module.exports = router;
