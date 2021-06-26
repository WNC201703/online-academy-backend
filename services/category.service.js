const { Category, categoryModel } = require("../models/category.model");
const { Course } = require('../models/course.model');
const { Enrollment } = require('../models/enrollment.model');
async function createCategory(parent, title) {
    const category = await categoryModel.addNewCategory(parent, title)
    return category;
}

async function getCategoryById(categoryId) {
    const category = await categoryModel.getCategoryById(categoryId)
    return category;
}


async function getCategoriesByparent(parent) {
    const categories = await categoryModel.getCategoriesByparent(parent)
    return categories;
}

async function getCategories() {
    const categories = await categoryModel.getAll();
    return categories;
}

async function getTopEnrrollmentCategoriesOfWeek() {
    const today = new Date();
    let sDay = new Date();
    sDay.setDate(today.getDate() - 7);
    const group = await Enrollment
    .aggregate([
        {
            $match: {createdAt: { $gte: sDay, $lte: today }}
        },
        {
            $lookup:{ from: 'courses', localField: 'course', foreignField: '_id', as: 'courseObject' }
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
    let counts={};
    let tmp=[];
    group.forEach(element => {
        counts[element._id[0]]=element.count;
        tmp.push(element._id[0]);
    });
    const categories = await Category.find({ _id: { "$in": tmp } }).select('-__v -parent');
    let results=[];
    for (let i = 0; i < categories.length; i++) {
        const c=categories[i];
        let obj={
            _id:c._id,
            title:c.title,
            enrollment:counts[c._id]
        };
        results.push(obj)
       categories[i].count=counts[categories[i]._id];
    }
    results.sort(function (a,b){return b.enrollment-a.enrollment});
    return results;
}


async function updateCategory(categoryId, body) {
    const category = await categoryModel.updateCategory(categoryId, body);
    return category;
}

async function deleteCategory(categoryId) {
    const category = await categoryModel.deleteCategory(categoryId);
    return category;
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

