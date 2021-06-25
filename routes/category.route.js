const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const categoryService = require('../services/category.service');
const courseService = require('../services/course.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');

//create a category
router.post('/', auth('admin'), asyncHandler(async (req, res, next) => {
    console.log('post');
    const { parent, title } = req.body;
    const category = await categoryService.createCategory(parent, title);
    return res.status(httpStatus.CREATED).json(category);
})
);

//get categories
router.get('/', asyncHandler(async (req, res, next) => {
    const parent = req.query.parent;
    if (!!parent) {
        const categories = await categoryService.getCategoriesByparent(parent);
        return res.status(httpStatus.OK).json(categories);
    }
    const categories = await categoryService.getCategories();
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
    const categoryId = req.params.categoryId;
    // const categories = categoryService.getCategoriesByparent();
    const courses = await courseService.getCoursesByCategory(categoryId);
    return res.status(httpStatus.OK).json(courses);
})
);

router.put('/:categoryId', auth('admin'),asyncHandler(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    console.log(categoryId);
    const category = await categoryService.updateCategory(categoryId, req.body);
    return res.status(httpStatus.OK).json(category);
}));

router.delete('/:categoryId', auth('admin'), asyncHandler(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const category = await categoryService.deleteCategory(categoryId);
    return res.status(httpStatus.OK).json(category);
}));

module.exports = router;
