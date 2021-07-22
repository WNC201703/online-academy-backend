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
            trim: true,
            default:""
        },
        category:
            { type: ObjectId, ref: 'Category', required: true },
        shortDescription: {
            type: String,
            trim: true,
            default:""
        },
        detailDescription: {
            type: String,
            trim: true,
            default:""
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

async function exists(courseId) {
    const course = await Course.findById(courseId);
    return !!course;
}

async function addNewCourse(teacherId, data) {
    const { name, shortDescription, detailDescription, category, price, percentDiscount } = data;
    const newCourse = new Course({
        teacher: teacherId,
        name: name,
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
    const course = await Course.findById(courseId)
    .select('-__v')
    .populate('teacher','fullname')
    .populate('category','name');
    console.log(course);
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


async function getNewestCourses() {
    const courses = await Course.find().sort({
        createdAt:-1
    }).limit(10).select('-__v').populate('teacher','fullname').populate('category','name');
    return courses;
}

async function getTopViewedCourses() {
    const courses = await Course.find().sort({
        view: -1
    }).limit(10).select('-__v').populate('teacher','fullname').populate('category','name');
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
        .select('-__v')
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize)
        .sort(sort)
        .populate('category','name')
        .populate('teacher','fullname');

    return {courses,totalCount};
}

async function updateCourse(courseId, newData) {
    newData.updatedAt=Date.now();
    const course = await Course.findByIdAndUpdate(courseId, newData);
    const updatedCourse = await Course.findById(courseId, { __v: 0 });
    return updatedCourse;
}

async function deleteCourse(courseId) {
    const result=await Course.deleteOne({_id:courseId});
    return result;
}

async function verifyTeacher(courseId, teacherId) {
    const course = await Course.findOne({ _id: courseId, teacher: teacherId },);
    return !!course;
}

module.exports = {
    Course,
    getCourseById,
    getAll,
    addNewCourse, deleteCourse, updateCourse,
    verifyTeacher ,
    getCourses,
    getNewestCourses,
    getTopViewedCourses,
    exists,
};
