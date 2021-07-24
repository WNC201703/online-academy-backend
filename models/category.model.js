const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const categorySchema = mongoose.Schema(
    {
        parent:
            { type: ObjectId, ref: 'Category' },
        name: {
            type: String,
            trim: true,
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
    },
);

const Category = mongoose.model('Category', categorySchema);


async function getCategoryById(categoryId) {
    const category = await Category.findById(categoryId).select('-__v').populate('parent', 'name');;
    return category;
}
async function getAll() {
    // const findObj={};
    // if (level){
    //     if (+level===1) findObj['parent'] = null;
    //     if (+level===2) findObj['parent'] = {$ne:null};
    // }
    const categories = await Category.find().select('-__v').populate('parent', 'name');
    return categories;
}

async function getParentCategories() {
    const categories = await Category.find({ parent: null }).select('-__v -parent')
    return categories;
}

async function getSubCategoriesByParent(parentId) {
    const categories = await Category.find({ parent: parentId }).select('-__v -parent')
    return categories;
}

async function updateCategory(categoryId, newData) {
    const category = await Category.findByIdAndUpdate(categoryId, newData);
    const updatedCategory = await Category.findById(categoryId, { __v: 0 });
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

async function exists(categoryId) {
    const category = await Category.findById(categoryId);
    return !!category;
}

async function deleteCategory(categories) {
    const result = await Category.deleteMany({
        _id: {
            $in: categories.map(category => category._id)
        }
    });
    return result;
}

async function getCategoriesByparent(parent) {
    const categories = await Category.find({ parent: mongoose.Types.ObjectId(parent) });
    return categories;
}

async function getCategoryAndChildren(categoryId) {
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

    let categories= [parent[0], ...parent[0].children];
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
    getParentCategories,
    getCategoryAndChildren ,
    getSubCategoriesByParent ,
    exists,
};
