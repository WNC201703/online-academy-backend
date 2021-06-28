const express = require('express');
const httpStatus = require("http-status");
const router = express.Router();
const courseService = require('../services/course.service');
const asyncHandler = require('../utils/asyncHandler')
const auth = require('../middlewares/auth.mdw');
const tokenService = require('../services/token.service')
const upload = require("../utils/upload");

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
    const { page_number, page_size, sort_by, key_word, category } = req.query;
    const results = await courseService.getCourses(+page_number, +page_size, sort_by, key_word, category);
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
router.get('/newest', asyncHandler(async (req, res, next) => {
    const courses = await courseService.getNewestCourses();
    return res.status(httpStatus.OK).json(courses);
})
);

//get top viewed courses
router.get('/top_viewed', asyncHandler(async (req, res, next) => {
    const courses = await courseService.getTopViewedCourses();
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
    const teacherId = tokenService.getPayloadFromRequest(req).userId;
    const course = await courseService.updateCourse(courseId, teacherId, req.body);
    return res.status(httpStatus.OK).json(course);
}));

router.delete('/:courseId', auth('teacher'), asyncHandler(async (req, res, next) => {
    const courseId = req.params.courseId;
    const course = await courseService.deleteCourse(courseId);
    return res.status(httpStatus.OK).json(course);
}));

router.post('/:courseId/enrollments', auth(), asyncHandler(async (req, res, next) => {
    const userId = tokenService.getPayloadFromRequest(req).userId;
    const enrollment = await courseService.enrollStudent(req.params.courseId, userId);
    return res.status(httpStatus.CREATED).json(enrollment);
})
);

router.post('/:courseId/reviews', auth(), asyncHandler(async (req, res, next) => {
    const { review, rating } = req.body;
    const courseId = req.params.courseId;
    const userId = tokenService.getPayloadFromRequest(req).userId;
    const result = await courseService.addReview(courseId, userId, review, rating);
    return res.status(httpStatus.CREATED).json(result);
})
);

//post course image
router.post('/:courseId/image', auth('teacher'), upload.single("image"), asyncHandler(async (req, res, next) => {
    const teacherId = tokenService.getPayloadFromRequest(req).userId;
    const imageUrl = await courseService.uploadCourseImage(req.file, req.params.courseId, teacherId);
    return res.status(httpStatus.CREATED).json({
        imageUrl:imageUrl
    });
})
);

module.exports = router;
