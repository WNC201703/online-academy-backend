const categoryModel = require("../models/category.model");

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

}

