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
    const category = req.query.category;
    if (!!category) {
        const courses = await courseService.getCoursesByCategory(category);
        return res.status(httpStatus.OK).json(courses);
    }
    const courses = await courseService.getCourses();
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

module.exports = router;
