const express = require('express');
const router = express.Router();
const httpStatus = require("http-status");
const asyncHandler = require('../utils/asyncHandler')
const courseService = require('../services/course.service');
const lessonService = require('../services/lesson.service');
const tokenService = require('../services/token.service')
const upload = require("../utils/upload");
const auth = require('../middlewares/auth.mdw');
const validate = require('../middlewares/validate.mdw');
const courseSchema = require('../schemas/course.schema');
const { ROLE } = require('../utils/constants')

//create a course
router.post('/',
    auth([ROLE.TEACHER]),
    upload.single("image"),
    validate(courseSchema.coursePOST),
    asyncHandler(async (req, res, next) => {
        console.log('post');
        const decoded = tokenService.getPayloadFromRequest(req);
        const teacherId = decoded.userId;
        console.log(req.file);
        const image = req.file;
        const data = req.body;
        const course = await courseService.createCourse(teacherId, data, image);
        return res.status(httpStatus.CREATED).json(course);
    })
);

//get courses
router.get('/',
    validate(courseSchema.courseGET,'query'),
    asyncHandler(async (req, res, next) => {
        const { page_number, page_size, sort_by, key_word, category,teacher } = req.query;
        const results = await courseService.getCourses(+page_number, +page_size, sort_by, key_word, category, teacher);
        return res.status(httpStatus.OK).json(results);
    })
);

//get top courses
router.get('/top',
    asyncHandler(async (req, res, next) => {
        const courses = await courseService.getTopCoursesOfTheWeek();
        return res.status(httpStatus.OK).json(courses);
    })
);

//get popular courses
router.get('/popular',
    asyncHandler(async (req, res, next) => {
        const courses = await courseService.getPopularCourses();
        return res.status(httpStatus.OK).json(courses);
    })
);

//get most newly created courses
router.get('/newest',
    asyncHandler(async (req, res, next) => {
        const courses = await courseService.getNewestCourses();
        return res.status(httpStatus.OK).json(courses);
    })
);

//get top viewed courses
router.get('/top_viewed',
    asyncHandler(async (req, res, next) => {
        const courses = await courseService.getTopViewedCourses();
        return res.status(httpStatus.OK).json(courses);
    })
);

//get related courses
router.get('/:courseId/related',
    asyncHandler(async (req, res, next) => {
        const courses = await courseService.getRelatedCourses(req.params.courseId);
        return res.status(httpStatus.OK).json(courses);
    })
);

router.get('/:courseId',
    asyncHandler(async (req, res, next) => {
        const courseId = req.params.courseId;
        const course = await courseService.getCourseById(courseId);
        return res.status(httpStatus.OK).json(course);
    })
);


router.put('/:courseId',
    auth([ROLE.TEACHER]),
    validate(courseSchema.coursePUT),
    asyncHandler(async (req, res, next) => {
        const courseId = req.params.courseId;
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const course = await courseService.updateCourse(courseId, teacherId, req.body);
        return res.status(httpStatus.OK).json(course);
    }));

router.delete('/:courseId',
    auth([ROLE.ADMIN]),
    asyncHandler(async (req, res, next) => {
        const courseId = req.params.courseId;
        await courseService.deleteCourse(courseId);
        return res.status(httpStatus.NO_CONTENT).json();
    }));

router.get('/:courseId/enrollments',
    auth([ROLE.TEACHER]),
    asyncHandler(async (req, res, next) => {
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const { courseId } = req.params;
        const enrollments = await courseService.getEnrollmentsByCourseId(courseId, teacherId);
        return res.status(httpStatus.CREATED).json(enrollments);
    })
);

router.post('/:courseId/enrollments',
    auth([ROLE.STUDENT]),
    asyncHandler(async (req, res, next) => {
        const userId = tokenService.getPayloadFromRequest(req).userId;
        const enrollment = await courseService.enrollStudent(req.params.courseId, userId);
        return res.status(httpStatus.CREATED).json(enrollment);
    })
);

router.get('/:courseId/reviews',
validate(courseSchema.courseReviewGET,'query'),
    asyncHandler(async (req, res, next) => {
        const courseId = req.params.courseId;
        const { page_number, page_size } = req.query;
        const result = await courseService.getReviews(courseId, +page_number, +page_size);
        return res.status(httpStatus.OK).json(result);
    })
);

router.post('/:courseId/reviews',
    auth([ROLE.STUDENT]),
    validate(courseSchema.courseReviewPOST),
    asyncHandler(async (req, res, next) => {
        const { review, rating } = req.body;
        const courseId = req.params.courseId;
        const userId = tokenService.getPayloadFromRequest(req).userId;
        const result = await courseService.addReview(courseId, userId, review, rating);
        return res.status(httpStatus.CREATED).json(result);
    })
);

//upload course image
router.put('/:courseId/image',
    auth([ROLE.TEACHER]),
    upload.single("image"), asyncHandler(async (req, res, next) => {
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const imageUrl = await courseService.uploadCourseImage(req.file, req.params.courseId, teacherId);
        return res.status(httpStatus.CREATED).json({
            imageUrl: imageUrl
        });
    })
);

//add course lessons 
router.post('/:courseId/lessons',
    auth([ROLE.TEACHER]),
    upload.single("video"), 
    validate(courseSchema.courseLessonPOST),
    asyncHandler(async (req, res, next) => {
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const { name, description } = req.body;
        const { courseId } = req.params;
        const video = req.file;
        const lesson = await lessonService.addLesson(courseId, teacherId, name, description, video);
        return res.status(httpStatus.CREATED).json(lesson);
    })
);

//get course lessons 
router.get('/:courseId/lessons',
    auth([ROLE.STUDENT, ROLE.TEACHER, ROLE.ADMIN]),
    asyncHandler(async (req, res, next) => {
        const { courseId } = req.params;
        const payload = tokenService.getPayloadFromRequest(req);
        const userId = payload.userId;

        const role = payload.role;

        switch (role) {
            case ROLE.STUDENT:
                const lessons0 = await lessonService.getAllLessonsByStudent(userId, courseId);
                return res.status(httpStatus.OK).json(lessons0);
            case ROLE.TEACHER:
                const lessons1 = await lessonService.getAllLessonsByTeacher(userId, courseId);
                return res.status(httpStatus.OK).json(lessons1);
            case ROLE.ADMIN:
                const lessons2 = await lessonService.getAllLessons(userId, courseId);
                return res.status(httpStatus.OK).json(lessons2);
        }
    })
);

//get preview lessons 
router.get('/:courseId/preview',
    asyncHandler(async (req, res, next) => {
        const { courseId } = req.params;
        const lessons = await lessonService.getPreviewLessons(courseId);
        return res.status(httpStatus.OK).json(lessons);
    })
);

//get course lesson by lessonNumber 
router.get('/:courseId/lessons/:lessonNumber',
    auth([ROLE.STUDENT]),
    asyncHandler(async (req, res, next) => {
        const { courseId, lessonNumber } = req.params;
        const lesson = await lessonService.getLessonByLessonNumber(courseId, lessonNumber);
        if (!lesson) res.status(httpStatus.NOT_FOUND).json({
            message: "Not found"
        });
        return res.status(httpStatus.CREATED).json(lesson);
    })
);

//update lesson 
router.put('/:courseId/lessons/:lessonId',
    auth([ROLE.TEACHER]),
    validate(courseSchema.courseLessonPUT),
    asyncHandler(async (req, res, next) => {
        const { courseId, lessonId } = req.params;
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const lesson = await lessonService.updateLessonInfo(courseId, teacherId, lessonId, req.body);
        if (!lesson) res.status(httpStatus.NOT_FOUND).json({
            message: "Not found"
        });
        return res.status(httpStatus.CREATED).json(lesson);
    })
);

//upload lesson video
router.put('/:courseId/lessons/:lessonId/video',
    auth([ROLE.TEACHER]),
    upload.single("video"),
    asyncHandler(async (req, res, next) => {
        const teacherId = tokenService.getPayloadFromRequest(req).userId;
        const { courseId, lessonId } = req.params;
        const videoUrl = await lessonService.uploadLessonVideo(req.file, teacherId, courseId, lessonId);
        return res.status(httpStatus.CREATED).json({
            videoUrl: videoUrl
        });
    })
);

module.exports = router;
