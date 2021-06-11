const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');

//create a category
router.post('/', auth('admin'), asyncHandler(async (req, res, next) => {
    console.log('post');
    const { parentId, title } = req.body;
    const category = await categoryService.createCategory(parentId, title);
    return res.status(httpStatus.CREATED).json(category);
})
);

//get categories
router.get('/', asyncHandler(async (req, res, next) => {
    const parentId = req.query.parentId;
    if (!!parentId) {
        const categories = await categoryService.getCategoriesByParentId(parentId);
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

router.put('/:categoryId', auth('admin'), auth(), asyncHandler(async (req, res, next) => {
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
