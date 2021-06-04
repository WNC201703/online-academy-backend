const validator = require('validator');
const mongoose = require('mongoose');

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
            throw 'invalid email address';
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
    },
  );

  userSchema.statics.isEmailExists = async function (email) {
    const user = await this.findOne({ email: email });
    return !!user;
  };
  
  const User = mongoose.model('User', userSchema);
  
  module.exports = User;
  