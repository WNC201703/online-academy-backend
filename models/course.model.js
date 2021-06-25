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
        view: {
            type: Number,
            default: 0
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
    let course = await Course.findById(courseId);
    try {
        course.view++;
        course.save();
    } catch (err) {
        console.log(err);
    }
    return course;
}

async function getAll() {
    const courses = await Course.find();
    return courses;
}

async function getCoursesByCategory(categories) {
    const courses = await Course.find({ category: { "$in": categories } });
    return courses;
}

async function getCourses(categories, page, perPage) {
    let courses,totalCount=0;
    if (categories.length === 0) {
        totalCount= await Course.countDocuments();
        courses = await Course.find().limit(perPage).skip(page * perPage);
    } else {
        totalCount= await Course.countDocuments({ category: { "$in": categories } });
        courses = await Course.find({ category: { "$in": categories } }).limit(perPage).skip(page * perPage);
    }
    return {
        "page_size":perPage,
        "page_number":page,
        "total_result_count": totalCount,
        "results":courses
    };
}

async function updateCourse(courseId, newData) {
    const course = await Course.findByIdAndUpdate(courseId, newData);
    const updatedCourse = await Course.findById(courseId, { __v: 0 });
    return updatedCourse;
}

async function deleteCourse(courseId) {
    return newCourse;
}

async function checkPermission(courseId, teacherId) {
    const course = await Course.findOne({ _id: courseId, teacher: teacherId },);
    return !!course;
}

module.exports = {
    Course,
    getCourseById,
    getAll,
    addNewCourse, deleteCourse, updateCourse,
    checkPermission,
    getCoursesByCategory,
    getCourses
};
