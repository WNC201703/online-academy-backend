const Joi = require('joi');

const courseSchema = {};

courseSchema.coursePOST = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    shortDescription: Joi.string(),
    detailDescription: Joi.string(),
    percentDiscount: Joi.number(),
    price: Joi.number()
});

courseSchema.courseGET = Joi.object({
    page_number:Joi.number(), 
    page_size:Joi.number(), 
    sort_by:Joi.string(), 
    key_word:Joi.string(), 
    category:Joi.string()
});

courseSchema.coursePUT=Joi.object({
    name: Joi.string(),
    category: Joi.string(),
    teacher: Joi.string(),
    shortDescription: Joi.string(),
    detailDescription: Joi.string(),
    percentDiscount: Joi.number(),
    price: Joi.number(),
    upload_complete:Joi.boolean(),
});
courseSchema.courseReviewGET=Joi.object({
    page_number:Joi.number(), 
    page_size:Joi.number(), 
});
courseSchema.courseReviewPOST=Joi.object({
    review:Joi.string(), 
    rating:Joi.number().required()
});
courseSchema.courseLessonPOST=Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
});
courseSchema.courseLessonPUT=Joi.object({
    name: Joi.string(),
    description: Joi.string(),
});

module.exports = courseSchema;