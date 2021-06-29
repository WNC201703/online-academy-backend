const courseModel = require("../models/course.model");
const categoryModel = require("../models/category.model");
const reviewModel = require("../models/review.model");
const enrollmentModel = require("../models/enrollment.model");
const lessonModel = require("../models/lesson.model");
const { Review } = reviewModel;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const cloudinary = require('../utils/cloudinary');

async function createCourse(teacherId, data, image) {
    const course = await courseModel.addNewCourse(teacherId, data);
    if (image) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(image.path,
                { public_id: `courses/${course._id}/image` });
            const uCourse = await courseModel.updateCourse(course._id, { imageUrl: uploadResponse.secure_url });
            return uCourse;
        } catch (err) {
            console.error(err);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
        }
    }
    return course;
}

async function getCourseById(courseId) {
    const course = await courseModel.getCourseById(courseId);
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, 'Not found course!');
    const courseReview = await Review.aggregate([
        {
            $match: {
                course: course._id
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

    const count = await enrollmentModel.countByCourseId(courseId);
    return {
        ...(course._doc),
        averageRating: courseReview[0].avgRating,
        numberOfReviews: courseReview[0].numberOfReviews,
        enrollments: count
    };
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
    const { courses, totalCount } = await courseModel.getCourses(pageNumber, pageSize, sortBy, keyword, categories);

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
    const { imageUrl, view, ...newData } = body;
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    const course = await courseModel.updateCourse(courseId, newData);
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

async function uploadCourseImage(file, courseId, teacherId) {
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    try {
        const uploadResponse = await cloudinary.uploader.upload(file.path,
            { public_id: `courses/${courseId}/image` });
        const course = await courseModel.updateCourse(courseId, { imageUrl: uploadResponse.secure_url });
        return course.imageUrl;
    } catch (err) {
        console.error(err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
}

async function addLesson(courseId, teacherId, name, description) {
    const permission = await courseModel.checkPermission(courseId, teacherId);
    if (!permission) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
    const lesson = await lessonModel.addLesson(courseId, name, description);
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
    uploadCourseImage,

    addLesson,
    getAllLessons,
    getLessonByLessonNumber,
    uploadLessonVideo,
    updateLessonInfo,
}

