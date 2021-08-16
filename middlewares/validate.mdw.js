const e = require('express');
const httpStatus = require('http-status');
const Joi = require('joi');
const ApiError = require('../utils/ApiError');
module.exports = (schema,property) => (req, res, next) => {
    let input;
    if (!property) input=req.body;
    else input=req[property];
    const {value,error} = schema.validate(input);
   
    if (error) {
        const { details } = error;
        const message = details.map(i => i.message).join(',').split('"').join('');
        throw new ApiError(httpStatus.BAD_REQUEST,message);
    } else {
        req.body=value;
        console.log(req.body);
        next();
    }
}