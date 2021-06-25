const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const courseService = require('../services/course.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');
const tokenService = require('../services/token.service')

//create a course
router.post('/', auth('teacher'), asyncHandler(async (req, res, next) => {
    console.log('post');
    const decoded = tokenService.getPayloadFromRequest(req);
    const teacherId = decoded.userId;
    const course = await courseService.createCourse(req.body, teacherId);
    return res.status(httpStatus.CREATED).json(course);
})
);

//get courses
router.get('/', asyncHandler(async (req, res, next) => {
    const { page_number, page_size, sort_by, key_word,category } = req.query;
    const results = await courseService.getCourses(+page_number, +page_size, sort_by, key_word,category);
    return res.status(httpStatus.OK).json(results);
})
);

//get popular courses
router.get('/popular', asyncHandler(async (req, res, next) => {
    const courses = await courseService.getPopularCourses();
    return res.status(httpStatus.OK).json(courses);
})
);

//get most newly created courses
router.get('/latest', asyncHandler(async (req, res, next) => {
    const courses = await courseService.getLatestCourses();
    return res.status(httpStatus.OK).json(courses);
})
);

router.get('/:courseId', asyncHandler(async (req, res, next) => {
    const courseId = req.params.courseId;
    const course = await courseService.getCourseById(courseId);
    return res.status(httpStatus.OK).json(course);
})
);


router.put('/:courseId', auth('teacher'), auth(), asyncHandler(async (req, res, next) => {
    const courseId = req.params.courseId;
    const decoded = tokenService.getPayloadFromRequest(req);
    const teacherId = decoded.userId;
    const course = await courseService.updateCourse(courseId, teacherId, req.body);
    return res.status(httpStatus.OK).json(course);
}));

router.delete('/:courseId', auth('teacher'), asyncHandler(async (req, res, next) => {
    const courseId = req.params.courseId;
    const course = await courseService.deleteCourse(courseId);
    return res.status(httpStatus.OK).json(course);
}));

router.post('/:courseId/enrollments', auth(), asyncHandler(async (req, res, next) => {
    const { courseId, userId } = req.body;
    if (req.params.courseId != courseId) return res.status(httpStatus.BAD_REQUEST).json();
    const enrollment = await courseService.enrollStudent(courseId, userId);
    return res.status(httpStatus.CREATED).json(enrollment);
})
);

module.exports = router;
