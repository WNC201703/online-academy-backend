const express = require('express');
const httpStatus = require("http-status");

const router = express.Router();
const authService = require('../../services/auth.service');
const asyncHandler=require('../../utils/asyncHandler')
router.post('/register', asyncHandler(async (req, res, next) => {
        await authService.userRegister(req.body);
      return res.status(httpStatus.CREATED).json({ success: true });
})
);

module.exports = router;
