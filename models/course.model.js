const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const courseSchema = mongoose.Schema(
    {
        teacher:
            { type: ObjectId, ref: 'User', required: true },
        name: {
            type: String,
            trim: true,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        category:
            { type: ObjectId, ref: 'Category', required: true },
        shortDescription: {
            type: String,
            trim: true,
            required: true,
        },
        detailDescription: {
            type: String,
            trim: true,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0
        },

        percentDiscount: {
            type: Number,
            default:
                0
        },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
);

const Course = mongoose.model('Course', courseSchema);

async function addNewCourse(teacherId, body) {
    const { name, imageUrl, shortDescription, detailDescription, category, price, percentDiscount } = body;
    const newCourse = new Course({
        teacher: teacherId,
        name: name,
        imageUrl: imageUrl,
        shortDescription: shortDescription,
        detailDescription: detailDescription,
        category: category,
        price: price,
        percentDiscount: percentDiscount
    });
    await newCourse.save();
    return newCourse;
}

async function getCourseById(courseId) {
    const course = await Course.findById(courseId, { __v: 0, password: 0 });
    return course;
}
async function getAll() {
    const courses = await Course.find();
    return courses;
}

async function getCoursesByCategory(categories) {
    const courses = await Course.find({category:{"$in":categories}});
    return courses;
}
async function updateCourse(courseId, teacherId, newData) {
    const course=await Course.findByIdAndUpdate(courseId, newData);
    const updatedCourse = await Course.findById(courseId, { __v: 0 });
    return updatedCourse;
}

async function deleteCourse(courseId) {
    return newCourse;
}

async function checkPermission(courseId, teacherId){
    const course = await Course.findOne({ _id: courseId, teacher: teacherId },);
    return !!course;
}

module.exports = {
    Course,
    getCourseById,
    getAll,
    addNewCourse, deleteCourse, updateCourse,
    checkPermission,
    getCoursesByCategory
};
