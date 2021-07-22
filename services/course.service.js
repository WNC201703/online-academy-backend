const courseModel = require("../models/course.model");
const categoryModel = require("../models/category.model");
const reviewModel = require("../models/review.model");
const enrollmentModel = require("../models/enrollment.model");
const lessonModel = require("../models/lesson.model");
const { Enrollment } = enrollmentModel;
const { Review } = reviewModel;
const { Course } = courseModel;
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
            return course;
            // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
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
    let data = course._doc;
    data.teacher = course._doc.teacher.fullname;
    data.category = course._doc.category.name;
    return {
        ...data,
        averageRating: courseReview[0] ? courseReview[0].avgRating : 0,
        numberOfReviews: courseReview[0] ? courseReview[0].numberOfReviews : 0,
        enrollments: count
    };
}


async function getAll() {
    const courses = await courseModel.getAll();
    return courses;
}


async function getPopularCourses() {
    // const courses = await courseModel.getPopularCourses();
    const today = new Date();
    let sDay = new Date();
    sDay.setDate(today.getDate() - 7);
    const enrollmentAggregate = await Enrollment.aggregate([
        {
            $match: {
                createdAt:
                    { $gte: sDay, $lte: today }
            }
        },
        {
            $group: {
                _id: '$course',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: - 1 }
        },
        {
            $limit: 4
        }
    ]);

    const courses = await Course.find({
        _id:{
            $in: enrollmentAggregate.map(item => item._id)
        }
    });
    return courses;
}

async function getNewestCourses() {
    const courses = await courseModel.getNewestCourses();
    const results = await getCoursesResponseData(courses);
    return results;
}

async function getTopViewedCourses() {
    const courses = await courseModel.getTopViewedCourses();
    const results = await getCoursesResponseData(courses);
    return results;
}

async function getRelatedCourses(courseId) {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found course');
    const courseAggregate = await Course.aggregate([
        {
            $match: {
                category: course.category,
                _id: {
                    $ne: course._id
                }
            },
        },
        {
            $lookup: { from: 'enrollments', localField: '_id', foreignField: 'course', as: 'enrollment' }
        },
        {
            $project: {
                _id: 1,
                enrollments: { $size: "$enrollment" }
            }
        },
        {
            $sort: { enrollments: - 1 }
        },
        {
            $limit: 5
        }
    ]);
    const courses = await Course.find(
        {
            _id: {
                $in: courseAggregate.map(course => course._id)
            }
        }
    );
    const results = await getCoursesResponseData(courses);
    return results;
}

async function getCourses(pageNumber, pageSize, sortBy, keyword, categoryId) {
    if (!pageNumber) pageNumber = 1;
    if (pageSize !== 0 && !pageSize) pageSize = 10;
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

    const results = await getCoursesResponseData(courses);

    const totalPages = totalCount === 0 ? 1 : (pageSize === 0) ? 1 : Math.ceil(totalCount / pageSize);
    return {
        "pageSize": pageSize === 0 ? totalCount : pageSize,
        "pageNumber": pageNumber ? pageNumber : 1,
        "totalPages": totalPages,
        "totalResults": totalCount,
        "results": results
    };
}

async function updateCourse(courseId, teacherId, body) {
    const { imageUrl, view, ...newData } = body;
    await verifyTeacher(courseId, teacherId);
    const course = await courseModel.updateCourse(courseId, newData);
    return course;
}

async function deleteCourse(courseId) {
    const exists = await courseModel.exists(courseId);
    if (!exists) throw new ApiError(httpStatus.BAD_REQUEST, "Course not found");
    await lessonModel.deleteCourseLessons(courseId);
    await reviewModel.deleteCourseReviews(courseId);
    await enrollmentModel.deleteCourseEnrollments(courseId);
    // await favouriteModel.deleteCourseFavourites(courseId);
    await courseModel.deleteCourse(courseId);
    const existsAfterDelete = await courseModel.exists(courseId);
    if (existsAfterDelete) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    return existsAfterDelete;
}

async function enrollStudent(courseId, studentId) {
    const exists = await enrollmentModel.exists(courseId, studentId);
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, "Student enrolled in the course");
    const erollment = await enrollmentModel.add(courseId, studentId);
    return erollment;
}

async function getEnrollmentsByCourseId(courseId, teacherId) {
    await verifyTeacher(courseId, teacherId);
    const erollments = await enrollmentModel.getByCourseId(courseId);
    return erollments;
}

async function getEnrollmentsByStudentId(studentId) {
    const erollments = await enrollmentModel.getByStudentId(studentId);
    const results = [];
    erollments.forEach(element => {
        if (element) {
            let data = { ...element._doc };
            data.course = element._doc.course._id;
            data['courseName'] = element._doc.course.name;
            results.push(data);
        }
    });

    return results;
}

async function addReview(courseId, userId, review, rating) {
    const enrollment = await enrollmentModel.get(courseId, userId);
    if (!enrollment) throw new ApiError(httpStatus.BAD_REQUEST, "Enrollment Not found");
    const exists = await reviewModel.exists(enrollment._id);
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, "Rated");
    const result = await reviewModel.add(enrollment._id, courseId, userId, review, rating);
    return result;
}

async function getReviews(courseId, pageNumber, pageSize) {
    if (!pageNumber) pageNumber = 1;
    if (pageSize !== 0 && !pageSize) pageSize = 10;
    console.log(pageSize);
    const totalCount = await Review.find({ course: courseId }).countDocuments();
    const reviews = await Review
        .find({ course: courseId })
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize)
        .select('-__v')
        .populate('user', 'fullname');

    reviews.forEach(element => {
        element._doc.username = element._doc.user.fullname;
        element._doc.user = element._doc.user._id;
    });


    const totalPages = totalCount === 0 ? 1 : (pageSize === 0) ? 1 : Math.ceil(totalCount / pageSize);
    return {
        "pageSize": pageSize === 0 ? totalCount : pageSize,
        "pageNumber": pageNumber ? pageNumber : 1,
        "totalPages": totalPages,
        "totalResults": totalCount,
        "results": reviews
    };
}

async function uploadCourseImage(file, courseId, teacherId) {
    await verifyTeacher(courseId, teacherId);
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

async function verifyTeacher(courseId, teacherId) {
    const verified = await courseModel.verifyTeacher(courseId, teacherId);
    if (!verified) throw new ApiError(httpStatus.FORBIDDEN, "Access is denied");
}

async function getCoursesResponseData(courses) {
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
        let data = element._doc;
        data.teacher = element._doc.teacher.fullname;
        data.category = element._doc.category.name;
        results.push({
            ...data,
            averageRating: coursesReviewObj[element._id] ? coursesReviewObj[element._id].avgRating : 0,
            numberOfReviews: coursesReviewObj[element._id] ? coursesReviewObj[element._id].numberOfReviews : 0,
        });
    });
    return results;
}

module.exports = {
    createCourse,

    getAll,
    getCourseById,
    getCourses,
    getEnrollmentsByCourseId,
    getEnrollmentsByStudentId,
    getPopularCourses,
    getNewestCourses,
    getTopViewedCourses,
    getRelatedCourses,
    getReviews,

    updateCourse,
    enrollStudent,
    addReview,
    uploadCourseImage,

    deleteCourse,
}

