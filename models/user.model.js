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
    role:{
      type:String,
      required:true,
      enum: ['admin', 'student','teacher']
    },
    verification_token: {
      type: String,
    },
    createdAt: { type: Date, default: Date.now },
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

async function exists(userId) {
  const user = await User.findById(userId);
  return !!user;
}

async function getUserByEmail(email) {
  const user = await User.findOne({ email: email });
  return user;
};
async function getUserById(userId){
  const user = await User.findById(userId, { __v: 0, password: 0 ,verification_token:0});
  return user; 
}
async function getAllUsers(role){
  const queryObj={active:true,};
  if (role) queryObj['role']=role;
  const users= await User.find(queryObj, { __v: 0, password: 0 ,verification_token:0});
  return users;
}
async function updateUserInfo(userId,newData){
  const user = await User.findByIdAndUpdate(userId,newData);
  return user;
}

async function deleteUser(userId){
  const result=await User.deleteOne({_id:userId});
  return result;
}

module.exports = {
  User,
  isEmailTaken,
  exists,
  getUserByEmail,
  getAllUsers,
  getUserById,
  updateUserInfo,
  deleteUser,
};
