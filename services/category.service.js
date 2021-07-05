const categoryModel = require("../models/category.model");
const { Category } = categoryModel;
const { Course } = require('../models/course.model');
const { Enrollment } = require('../models/enrollment.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

async function createCategory(parent, name) {
    console.log(parent, name);
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

async function getCategories(level) {
    const categories = await categoryModel.getAll(level);
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

async function getTopEnrrollmentCategoriesOfWeek() {
    const today = new Date();
    let sDay = new Date();
    sDay.setDate(today.getDate() - 7);
    const group = await Enrollment
        .aggregate([
            {
                $match: { createdAt: { $gte: sDay, $lte: today } }
            },
            {
                $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseObject' }
            },
            {
                $group: {
                    _id: '$courseObject.category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: - 1 }
            },
            {
                $limit: 10
            },

        ]);
    //get data to response
    let counts = {};
    let tmp = [];
    group.forEach(element => {
        counts[element._id[0]] = element.count;
        tmp.push(element._id[0]);
    });
    const categories = await Category.find({ _id: { "$in": tmp } }).select('-__v -parent');
    let results = [];
    for (let i = 0; i < categories.length; i++) {
        const c = categories[i];
        let obj = {
            _id: c._id,
            name: c.name,
            enrollment: counts[c._id]
        };
        results.push(obj)
        categories[i].count = counts[categories[i]._id];
    }
    results.sort(function (a, b) { return b.enrollment - a.enrollment });
    return results;
}


async function updateCategory(categoryId, body) {
    const category = await categoryModel.updateCategory(categoryId, body);
    return category;
}

async function deleteCategory(categoryId) {
    const categories = await categoryModel.getChildren(categoryId);
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
    const result = await categoryModel.deleteCategory(categories);
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
    updateCategory,
    getTopEnrrollmentCategoriesOfWeek
}

