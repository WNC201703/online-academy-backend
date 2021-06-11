const { User } = require("../models/category.model");
const categoryModel = require("../models/category.model");
const ApiError = require('../utils/ApiError');

async function createCategory(parentId, title) {
    const category = await categoryModel.addNewCategory(parentId, title)
    return category;
}

async function getCategoryById(categoryId) {
    const category = await categoryModel.getCategoryById(categoryId)
    return category;
}

async function getCategoriesByParentId(parentId) {
    const categories = await categoryModel.getCategoriesByParentId(parentId)
    return categories;
}

async function getCategories() {
    const categories = await categoryModel.getAll();
    return categories;
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
    getCategoriesByParentId,
    deleteCategory,
    getCategories,
    updateCategory, 

}

