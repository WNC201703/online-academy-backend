const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const categorySchema = mongoose.Schema(
    {
        parent: 
            { type: ObjectId, ref: 'Category'},
        name: {
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

async function addNewCategory(parent, name) {
    const newCategory = new Category({
        parent: parent,
        name: name
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

async function getChildren(categoryId){
    if (!categoryId) return null;
    const parent = await Category.aggregate([
        {
            $sort: { order: 1 }
        },
        {
            $graphLookup: {
                from: 'categories',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'children',
            }
        },
        {
            $match: {
                _id: mongoose.Types.ObjectId(categoryId)
            }
        }
    ]);
    const categories=[parent[0],...parent[0].children];
    return categories;
}

module.exports = {
    Category,
    getCategoryById,
    getAll,
    addNewCategory, 
    deleteCategory, 
    updateCategory,
    getCategoriesByparent,
    getChildren,
};
