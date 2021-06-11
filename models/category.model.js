const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
    {
        parentId: {
            type: String,
        },
        title: {
            type: String,
            trim: true,
            required: true,
        },
    },
);

const Category = mongoose.model('Category', categorySchema);


async function getCategoryById(categoryId) {
    const category = await Category.findById(categoryId, { __v: 0, password: 0 });
    return category;
}
async function getAll() {
    const categories = await Category.find();
    return categories;
}
async function updateCategory(categoryId, newData) {
    const category = await Category.findByIdAndUpdate(categoryId, newData);
    const updatedCategory=await Category.findById(categoryId ,{ __v: 0});
    return updatedCategory;
}

async function addNewCategory(parentId, title) {
    console.log(parentId);
    const newCategory = new Category({
        parentId: parentId,
        title: title
    });
    await newCategory.save();
    return newCategory;
}

async function deleteCategory(categoryId) {
    // const category=cate
    return newCategory;
}

async function getCategoriesByParentId(parentId) {
    const categories = await Category.find({ parentId: mongoose.Types.ObjectId(parentId) });
    return categories;
}

module.exports = {
    Category,
    getCategoryById,
    getAll,
    addNewCategory, deleteCategory, updateCategory,
    getCategoriesByParentId
};
