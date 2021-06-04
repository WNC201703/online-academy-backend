const User = require("../models/user.model");
const bcrypt = require('bcrypt');
const ApiError=require('../utils/ApiError');
const httpStatus=require('http-status')
const userRegister = async (body)=>{
    const {email,fullname, password } = body;
    if (await User.isEmailExists(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is taken");
      }
      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        fullname:fullname,
        email:email,
        password: hashPassword,
      });
      await newUser.save();
      return newUser;
  }

  module.exports={
      userRegister
  }