const httpStatus = require('http-status');
const Joi = require('joi');
const ApiError = require('../utils/ApiError');
module.exports = (schema) => (req, res, next) => {
    const {value,error} = schema.validate(req.body);
   
    if (error) {
        const { details } = error;
        const message = details.map(i => i.message).join(',').split('"').join('');
        throw new ApiError(httpStatus.BAD_REQUEST,message);
    } else {
        req.body=value;
        next();
    }
}