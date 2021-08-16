const Joi = require('joi');

const createAccountSchema = Joi.object({
        fullname: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });


module.exports={
    createAccountSchema
}