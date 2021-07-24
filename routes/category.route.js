const express = require('express');
const router = express.Router();
const httpStatus = require("http-status");
const asyncHandler = require('../utils/asyncHandler')
const categoryService = require('../services/category.service');
const courseService = require('../services/course.service');
const auth = require('../middlewares/auth.mdw');
const {ROLE} = require('../utils/constants')

//create a category
router.post('/', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
    console.log('post');
    const { parent, name } = req.body;
    const category = await categoryService.createCategory(parent, name);
    return res.status(httpStatus.CREATED).json(category);
})
);

//get categories
router.get('/', asyncHandler(async (req, res, next) => {
    const categories = await categoryService.getCategories();
    return res.status(httpStatus.OK).json(categories);
})
);

//get top enrollment categories of the week
router.get('/top_enrollment', asyncHandler(async (req, res, next) => {
    const categories = await categoryService.getTopEnrrollmentCategoriesOfWeek();
    return res.status(httpStatus.OK).json(categories);
})
);

router.get('/:categoryId', asyncHandler(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const category = await categoryService.getCategoryById(categoryId);
    return res.status(httpStatus.OK).json(category);
})
);

router.get('/:categoryId/courses', asyncHandler(async (req, res, next) => {
    const { page_number, page_size, sort_by, key_word } = req.query;
    const results = await courseService.getCourses(+page_number, +page_size, sort_by, key_word,req.params.categoryId);
    return res.status(httpStatus.OK).json(results);
})
);


router.put('/:categoryId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    console.log(categoryId);
    const category = await categoryService.updateCategory(categoryId, req.body);
    return res.status(httpStatus.OK).json(category);
}));

router.delete('/:categoryId', auth([ROLE.ADMIN]), asyncHandler(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const result = await categoryService.deleteCategory(categoryId);
    return res.status(httpStatus.NO_CONTENT).json();
}));

module.exports = router;
