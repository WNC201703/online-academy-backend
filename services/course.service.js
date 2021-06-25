const courseModel = require("../models/course.model");
const categoryModel = require("../models/category.model");
const {Category} = categoryModel;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
async function createCourse(body, teacherId) {
    const course = await courseModel.addNewCourse(teacherId, body);

    return course;
}

async function getCourseById(courseId) {
    const course = await courseModel.getCourseById(courseId)
    return course;
}


async function getCourses() {
    const courses = await courseModel.getAll();
    return courses;
}

async function getCoursesByCategory(categoryId) {
    const categories=await categoryModel.getChildren(categoryId);
    const courses = await courseModel.getCoursesByCategory(categories);
    return courses;
}

async function updateCourse(courseId, teacherId, body) {
    const permission=await courseModel.checkPermission(courseId,teacherId);
    if (!permission)  throw new ApiError(httpStatus.FORBIDDEN, "Access is denied"); 
    const course = await courseModel.updateCourse(courseId,teacherId, body);
    return course;
}


async function deleteCourse(courseId) {
    const course = await courseModel.deleteCourse(courseId);
    return course;
}

module.exports = {
    createCourse,
    getCourseById,
    deleteCourse,
    getCourses,
    updateCourse,
    getCoursesByCategory

}

