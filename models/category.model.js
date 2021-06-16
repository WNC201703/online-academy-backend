const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const categorySchema = mongoose.Schema(
    {
        parent: 
            { type: ObjectId, ref: 'Category'},
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

async function addNewCategory(parent, title) {
    const newCategory = new Category({
        parent: parent,
        title: title
    });
    await newCategory.save();
    return newCategory;
}

async function deleteCategory(categoryId) {
    // const category=cate
    return newCategory;
}

async function getCategoriesByparent(parent) {
    const categories = await Category.find({ parent: mongoose.Types.ObjectId(parent) });
    return categories;
}

module.exports = {
    Category,
    getCategoryById,
    getAll,
    addNewCategory, deleteCategory, updateCategory,
    getCategoriesByparent
};
