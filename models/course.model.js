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

async function getPopularCourses() {
    const courses = await Course.find();
    return courses;
}

async function getLatestCourses() {
    const courses = await Course.find().sort({
        createdAt:-1
    }).limit(10);
    return courses;
}

async function getTopViewedCourses() {
    const courses = await Course.find().sort({
        view: -1
    }).limit(10);
    return courses;
}


async function getCoursesByCategory(categories) {
    const courses = await Course.find({ category: { "$in": categories } });
    return courses;
}

async function getCourses(pageNumber, pageSize, sort, keyword, categories) {
    let regex = new RegExp(keyword, 'i');
    let obj = {};
    if (keyword) obj['name'] = regex;
    if (categories) obj['category'] = { "$in": categories };
    let courses, totalCount = 0;
    totalCount = await Course.countDocuments(
        obj
    );
    courses = await Course.find(
        obj
    )
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize)
        .sort(sort)
        .populate('category','name')
        .populate('teacher','fullname');
    const totalPages = totalCount == 0 ? 1 : Math.ceil(totalCount / pageSize);
    return {
        "page_size": pageSize ? pageSize : totalCount,
        "page_number": pageNumber ? pageNumber : 1,
        "total_pages": pageSize ? totalPages : 1,
        "total_results": totalCount,
        "results": courses
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
    getCourses,
    getPopularCourses,
    getLatestCourses,
    getTopViewedCourses,
};
