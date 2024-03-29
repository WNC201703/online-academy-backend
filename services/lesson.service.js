const courseModel = require("../models/course.model");
const lessonModel = require("../models/lesson.model");
const enrollmentModel = require("../models/enrollment.model");
const completedLessonModel = require("../models/completedLesson.model");
const { Lesson } = lessonModel;
const { Course } = courseModel;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const cloudinary = require('../utils/cloudinary');

async function addLesson(courseId, teacherId, name, description, video) {
    await verifyTeacher(courseId, teacherId);
    const lesson = await lessonModel.addLesson(courseId, name, description);
    if (video) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(video.path,
                { resource_type: "video", public_id: `courses/${courseId}/lessons/lesson${lesson.lessonNumber}` });
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

async function getAllLessonsByStudent(userId, courseId) {
    const enrollment = await enrollmentModel.get(courseId, userId);
    if (!enrollment) throw new ApiError(httpStatus.FORBIDDEN, "Not found enrollment");
    const lessons = await lessonModel.getAllLessons(courseId);
    const data = await completedLessonModel.get(userId, courseId);
    const completedLessons = data.map((item) => '' + item.lesson);
    lessons.forEach(element => {
        element._doc['completed'] = false;
        const completed = completedLessons.includes('' + element._doc._id);
        console.log(completed)
        if (completed) {
            element._doc['completed'] = true;
        }
    });
    return lessons;
}

async function getAllLessonsByTeacher(teacherId, courseId) {
    const course = await Course.findOne({ _id: courseId, teacher: teacherId });
    if (!course) throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
    const lessons = await lessonModel.getAllLessons(courseId);
    return lessons;
}

async function getPreviewLessons(courseId) {
    const lessons = await lessonModel.getPreviewLessons(courseId);
    lessons.forEach(element => {
        if (element._doc.lessonNumber > 3) {
            element._doc.videoUrl = null;
        }
    });
    return lessons;
}

async function getLessonByLessonNumber(courseId, lessonNumber) {
    const lesson = await lessonModel.getLessonByLessonNumber(courseId, lessonNumber);
    return lesson;
}

async function uploadLessonVideo(file, teacherId, courseId, lessonId) {
    await verifyTeacher(courseId, teacherId);
    try {
        const uploadResponse = await cloudinary.uploader.upload(file.path,
            { resource_type: "video", public_id: `courses/${courseId}/lessons/${lessonId}` });
        console.log(uploadResponse);
        const course = await lessonModel.updateLesson(courseId, lessonId, { videoUrl: uploadResponse.secure_url });
        return course.videoUrl;
    } catch (err) {
        console.error(err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
}
async function updateLessonInfo(courseId, teacherId, lessonId, body) {
    const { videoUrl, ...newData } = body;
    await verifyTeacher(courseId, teacherId);
    const course = await lessonModel.updateLesson(courseId, lessonId, newData);
    return course;
}

async function verifyTeacher(courseId, teacherId) {
    const verified = await courseModel.verifyTeacher(courseId, teacherId);
    if (!verified) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
}
module.exports = {
    addLesson,
    getAllLessons,
    getAllLessonsByStudent,
    getAllLessonsByTeacher,
    getPreviewLessons,
    getLessonByLessonNumber,
    uploadLessonVideo,
    updateLessonInfo,
}