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
    page_number:Joi.allow(), 
    page_size:Joi.allow(), 
    sort_by:Joi.allow(), 
    key_word:Joi.allow(), 
    category:Joi.allow(),
    teacher:Joi.allow(),
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