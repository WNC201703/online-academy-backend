const courseModel = require("../models/course.model");
const categoryModel = require("../models/category.model");
const reviewModel = require("../models/review.model");
const enrollmentModel = require("../models/enrollment.model");
const mongoose = require('mongoose');
const { Category } = categoryModel;
const { Course } = courseModel;
const { Review } = reviewModel;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const cloudinary = require('../utils/cloudinary');

async function createCourse(body, teacherId) {
    const course = await courseModel.addNewCourse(teacherId, body);

    return course;
}

async function getCourseById(courseId) {
    const course = await courseModel.getCourseById(courseId)
    return course;
}


async function getAll() {
    const courses = await courseModel.getAll();
    return courses;
}


async function getPopularCourses() {
    const courses = await courseModel.getPopularCourses();
    return courses;
}

async function getNewestCourses() {
    const courses = await courseModel.getNewestCourses();
    return courses;
}

async function getTopViewedCourses() {
    const courses = await courseModel.getTopViewedCourses();
    return courses;
}

// async function getCoursesByCategory(categoryId) {
//     const categories = await categoryModel.getChildren(categoryId);
//     const courses = await courseModel.getCoursesByCategory(categories);
//     return courses;
// }

async function getCourses(pageNumber, pageSize, sortBy, keyword, categoryId) {
    let sort = {};
    const categories = await categoryModel.getChildren(categoryId);
    if (sortBy) {
        const arr = sortBy.split(',');
        arr.forEach(item => {
            const spl = item.split('.');
            sort[spl[0]] = spl[1] === 'desc' ? -1 : 1;
        });
    }
    if (!pageNumber) pageNumber = 1;
    if (!pageSize) pageSize = 10;
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
        .populate('category', 'name')
        .populate('teacher', 'fullname');

    const coursesReview = await Review.aggregate([
        {
            $match: {
                course: {
                    $in: courses.map(course => course._id)
                }
            }
        },
        {
            $group: {
                _id: '$course',
                avgRating: {
                    $avg: '$rating',
                },
                numberOfReviews: {
                    $sum: 1
                }
            }
        }
    ]);

    let coursesReviewObj = {};
    coursesReview.forEach(element => {
        coursesReviewObj[element._id] = {
            avgRating: element.avgRating,
            numberOfReviews: element.numberOfReviews
        };
    });

    let results = [];
    courses.forEach(element => {
        results.push({
            ...(element._doc),
            averageRating: coursesReviewObj[element._id] ? coursesReviewObj[element._id].avgRating : 0,
            numberOfReviews: coursesReviewObj[element._id] ? coursesReviewObj[element._id].numberOfReviews : 0,
        });
    });
    const totalPages = totalCount == 0 ? 1 : Math.ceil(totalCount / pageSize);
    return {
        "pageSize": pageSize ? pageSize : totalCount,
        "pageNumber": pageNumber ? pageNumber : 1,
        "totalPages": pageSize ? totalPages : 1,
        "totalResults": totalCount,
        "results": results
    };
}

async function updateCourse(courseId, teacherId, body) {
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    const course = await courseModel.updateCourse(courseId, body);
    return course;
}

async function deleteCourse(courseId) {
    const course = await courseModel.deleteCourse(courseId);
    return course;
}

async function enrollStudent(courseId, studentId) {
    const exists = await enrollmentModel.exists(courseId, studentId);
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, "Student enrolled in the course");
    const erollment = await enrollmentModel.add(courseId, studentId);
    return erollment;
}

async function addReview(courseId, userId, review, rating) {
    const enrollment = await enrollmentModel.get(courseId, userId);
    if (!enrollment) throw new ApiError(httpStatus.BAD_REQUEST, "Not valid student");
    const exists = await reviewModel.exists(enrollment._id);
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, "Rated");
    const result = await reviewModel.add(enrollment._id, courseId, userId, review, rating);
    return result;
}

async function uploadCourseImage(file,courseId,teacherId){
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    try {
        const uploadResponse = await cloudinary.uploader.upload(file.path,
            { public_id: `courses/${courseId}/image` });
        const course = await courseModel.updateCourse(courseId,{imageUrl:uploadResponse.secure_url});
        return course.imageUrl;
    } catch (err) {
        console.error(err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
}
module.exports = {
    createCourse,
    getAll,
    getCourseById,
    deleteCourse,
    getCourses,
    updateCourse,
    enrollStudent,
    getPopularCourses,
    getNewestCourses,
    getTopViewedCourses,
    addReview,
    uploadCourseImage
}

