const courseModel = require("../models/course.model");
const categoryModel = require("../models/category.model");
const { Category } = categoryModel;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const enrollmentModel = require("../models/enrollment.model");
const reviewModel = require("../models/review.model");
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

async function getLatestCourses() {
    const courses = await courseModel.getLatestCourses();
    return courses;
}

async function getTopViewedCourses() {
    const courses = await courseModel.getTopViewedCourses();
    return courses;
}

async function getCoursesByCategory(categoryId) {
    const categories = await categoryModel.getChildren(categoryId);
    const courses = await courseModel.getCoursesByCategory(categories);
    return courses;
}

async function getCourses(pageNumber, pageSize, sortBy, keyWord,categoryId) {
    let sort={};
    const categories = await categoryModel.getChildren(categoryId);
    if (sortBy){
        const arr = sortBy.split(',');
        arr.forEach(item => {
            const spl = item.split('.');
            sort[spl[0]] = spl[1] === 'desc' ? -1:1;
        });
    }
    const result = await courseModel.getCourses(pageNumber,pageSize,sort,keyWord,categories);
    return result;
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

async function addReview(courseId,userId,review,rating){
    const enrollment = await enrollmentModel.get(courseId, userId);
    if (!enrollment) throw new ApiError(httpStatus.BAD_REQUEST, "Not valid");
    const exists = await reviewModel.exists(enrollment._id);
    if (exists)  throw new ApiError(httpStatus.BAD_REQUEST, "Rated");
    const result = await reviewModel.add(enrollment._id,courseId, userId,review,rating);
    return result;
}

module.exports = {
    createCourse,
    getAll,
    getCourseById,
    deleteCourse,
    getCourses,
    updateCourse,
    getCoursesByCategory,
    enrollStudent,
    getPopularCourses,
    getLatestCourses,
    getTopViewedCourses,
    addReview

}

