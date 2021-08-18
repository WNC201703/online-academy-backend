const Joi = require('joi');

const userSchemas = {};

userSchemas.userPOST = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

userSchemas.userPUT = Joi.object({
    fullname: Joi.string(),
    email: Joi.string().email(),
    currentPassword: Joi.string().min(6),
    password: Joi.string().min(6),
});

userSchemas.userLOGIN = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

userSchemas.userEmailVERIFICATION = Joi.object({
    email: Joi.string().email().required(),
});

userSchemas.userEmailPUT = Joi.object({
    currentPassword: Joi.string().min(6),
    newEmail: Joi.string().email().required(),
});


userSchemas.teacherProfilePUT = Joi.object({
    name: Joi.allow(),
    introduction: Joi.allow(),
});


module.exports = userSchemas;