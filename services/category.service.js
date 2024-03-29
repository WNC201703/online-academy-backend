const categoryModel = require("../models/category.model");
const { Category } = categoryModel;
const { Course } = require('../models/course.model');
const { Enrollment } = require('../models/enrollment.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

async function createCategory(parent, name) {
    const category = await categoryModel.addNewCategory(parent, name)
    return category;
}

async function getCategoryById(categoryId) {
    const category = await categoryModel.getCategoryById(categoryId);
    let data = { ...category._doc };
    data.parent = category._doc.parent._id;
    data['parentName'] = category._doc.parent.name;
    console.log(data);
    return data;
}


async function getCategoriesByparent(parent) {
    const categories = await categoryModel.getCategoriesByparent(parent)
    return categories;
}

async function getSubCategories() {
    const categories=await categoryModel.getSubCategories();
    return categories;
}

async function getCategories(type) {
    if (type === 'list') {
        const categories = await categoryModel.getAll();
        const results = [];
        categories.forEach(element => {
            let data = { ...element._doc };
            if (element._doc.parent) {
                data.parent = element._doc.parent._id;
                data.parentName = element._doc.parent.name;
            }
            else {
            }
            results.push(data);
        });
        return results;
    }
    else {
        const categories = await categoryModel.getParentCategories();
        const results = [];
        await Promise.all(categories.map(async (category) => {
            let data = { ...category._doc };
            const children = await categoryModel.getSubCategoriesByParent(category._id);
            data['children'] = children;
            results.push(data);
        }));
        return results;
    }
}

async function getTopEnrrollmentCategoriesOfWeek() {
    const today = new Date();
    let sDay = new Date();
    sDay.setDate(today.getDate() - 7);
    const enrollmentAggregate = await Enrollment
        .aggregate([
            {
                $match: { createdAt: { $gte: sDay, $lte: today } }
            },
            {
                $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseObject' }
            },
            {
                $project: {
                    'category': {
                        $arrayElemAt: ['$courseObject.category', 0]
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: - 1 }
            },
            {
                $limit: 1
            },

        ]);

    if (enrollmentAggregate.length === 0) return [];

    const category = await Category.findById(enrollmentAggregate[0]._id).select('-__v -parent');

    return {
        ...(category._doc),
        enrollments: enrollmentAggregate[0].count
    };
}


async function updateCategory(categoryId, body) {
    const checkCategory=await Category.findById(categoryId);
    if (!checkCategory) throw new ApiError(httpStatus.BAD_REQUEST,'Category not found');
    const category = await categoryModel.updateCategory(categoryId, body);
    return category;
}

async function deleteCategory(categoryId) {
    const categories = await categoryModel.getCategoryAndChildren(categoryId);
    const courses = await Course.aggregate([
        {
            $match: {
                category: {
                    $in: categories.map(category => category._id)
                }
            }
        }
    ]);
    if (courses.length !== 0) throw new ApiError(httpStatus.BAD_REQUEST, "Category exists courses");
    const result = await categoryModel.deleteCategory([...categories, categoryId]);
    const exists = await categoryModel.exists(categoryId);
    if (exists) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    return exists;
}

module.exports = {
    createCategory,
    getCategoryById,
    getCategoriesByparent,
    deleteCategory,
    getCategories,
    getSubCategories,
    updateCategory,
    getTopEnrrollmentCategoriesOfWeek
}

