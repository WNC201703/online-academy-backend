const validator = require('validator');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const userSchema = mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw Error('invalid email address');
        }
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 6,
      minUppercase: 1,
      minNumbers: 1,
      minLowercase: 1
    },
    active: {
      type: Boolean,
      default: false
    },
    verify_token: {
      type: String,
    }
  },
);

userSchema.statics.emailAlreadyInUse = async function (email) {
  const user = await this.findOne({ email: email,active:true });
  return !!user;
};

userSchema.statics.getInactiveAccount = async function (email) {
  const user = await this.findOne({ email: email,active:false });
  return user;
};


userSchema.statics.verify = async function (token) {
  const user = await this.findOne({ verify_token: token });
  
  if (!!user) {
    user.active=true;
    user.verify_token='';
    user.save();

    console.log(user);
  }
  if (!!user && user.active)  return true;
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
