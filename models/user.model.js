const validator = require('validator');
const mongoose = require('mongoose');
const SALT_WORK_FACTOR = 10;
const bcrypt = require('bcrypt');

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
          throw Error('Invalid email address');
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
      required:true,
      default: false
    },
    verification_token: {
      type: String,
    },
  },
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_WORK_FACTOR);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.validatePassword = async function validatePassword(pw) {
  return bcrypt.compare(pw, this.password);
};

const User = mongoose.model('User', userSchema);


async function isEmailTaken(email) {
  const user = await User.findOne({ email: email });
  return !!user;
};

async function getUserByEmail(email) {
  const user = await User.findOne({ email: email });
  return user;
};

module.exports = {
  User,
  isEmailTaken,
  getUserByEmail
};
