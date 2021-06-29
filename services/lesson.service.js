const courseModel = require("../models/course.model");
const lessonModel = require("../models/lesson.model");
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const cloudinary = require('../utils/cloudinary');


async function addLesson(courseId, teacherId, name, description, video) {
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    const lesson = await lessonModel.addLesson(courseId, name, description);
    if (video) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(video.path,
                { resource_type: "video", public_id: `courses/${courseId}/lessons/${lesson.lessonNumber}` });
            console.log(uploadResponse);
            const uLesson = await lessonModel.updateLesson(courseId, lesson.lessonNumber, { videoUrl: uploadResponse.secure_url });
            return uLesson;
        } catch (err) {
            console.error(err);
            return lesson;
            // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
        }
    }

    return lesson;
}

async function getAllLessons(courseId) {
    const lessons = await lessonModel.getAllLessons(courseId);
    return lessons;
}

async function getLessonByLessonNumber(courseId, lessonNumber) {
    const lesson = await lessonModel.getLessonByLessonNumber(courseId, lessonNumber);
    return lesson;
}

async function uploadLessonVideo(file, teacherId, courseId, lessonNumber) {
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    try {
        const uploadResponse = await cloudinary.uploader.upload(file.path,
            { resource_type: "video", public_id: `courses/${courseId}/lessons/${lessonNumber}` });
        console.log(uploadResponse);
        const course = await lessonModel.updateLesson(courseId, lessonNumber, { videoUrl: uploadResponse.secure_url });
        return course.videoUrl;
    } catch (err) {
        console.error(err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
}
async function updateLessonInfo(courseId, teacherId, lessonNumber, body) {
    const { videoUrl, ...newData } = body;
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    const course = await lessonModel.updateLesson(courseId, lessonNumber, newData);
    return course;
}
module.exports ={
    addLesson,
    getAllLessons,
    getLessonByLessonNumber,
    uploadLessonVideo,
    updateLessonInfo,
}