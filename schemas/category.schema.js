const Joi = require('joi');

const categorySchema = {};

categorySchema.categoryPOST = Joi.object({
    name: Joi.string().required(),
    parent: Joi.required(),
});

categorySchema.categoryPUT = Joi.object({
    name: Joi.string(),
    parent: Joi.allow()
});

module.exports = categorySchema;