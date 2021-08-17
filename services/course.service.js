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
    const newestCoursesId = await getNewestCoursesId();
    const bestSellerCoursesId = await getBestSellerCoursesId();

    const count = await enrollmentModel.countByCourseId(course._id);
    let data = course._doc;
    data.teacher = course._doc.teacher.fullname;
    data.category = course._doc.category.name;
    return {
        ...data,
        averageRating: courseReview[0] ? courseReview[0].avgRating.toFixed(2) : 0,
        numberOfReviews: courseReview[0] ? courseReview[0].numberOfReviews.toFixed(2) : 0,
        enrollments: count,
        new: newestCoursesId.includes(`${course._id}`),
        bestseller: bestSellerCoursesId.includes(`${course._id}`)
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
    const aggregate = await Enrollment.aggregate([
        // {
        //     $match: {
        //         createdAt:
        //             { $gte: sDay, $lte: today }
        //     }
        // },
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
            $limit: 5
        },
        {
            $lookup: { from: 'reviews', localField: '_id', foreignField: 'course', as: 'review' }
        },
        {
            $addFields: {
                averageRating: {
                    $avg: "$review.rating",
                },
            }
        },
        {
            $project: {
                _id: 1,
                averageRating: 1,
                numberOfReviews: { $size: "$review" },
            }
        }
    ]);

    const results = await getCoursesByIdList(aggregate.map(item => item._id));
    return results;
}

async function getNewestCourses() {
    const courses = await courseModel.getNewestCourses();
    const results = await getCoursesByIdList(courses.map(item => item._id));
    return results;
}

async function getTopViewedCourses() {
    const courses = await courseModel.getTopViewedCourses();
    const results = await getCoursesByIdList(courses.map(item => item._id));
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
    const results = await getCoursesByIdList(courseAggregate.map(course => course._id));
    return results;
}

async function getCourses(pageNumber, pageSize, sortBy, keyword, categoryId) {
    if (!pageNumber) pageNumber = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    let sort = {};
    const categories = await categoryModel.getCategoryAndChildren(categoryId);
    if (sortBy) {
        const arr = sortBy.split(',');
        arr.forEach(item => {
            const spl = item.split('.');
            if (spl[0] === 'rating') {
                spl[0] = 'averageRating';
            }
            sort[spl[0]] = spl[1] === 'desc' ? -1 : 1;
        });
    }
    if (!Object.keys(sort).length) sort = { _id: 1 };
    let query = {};
    if (keyword){
        query={
            $text: {
                $search: `"${keyword}"`,
                $caseSensitive: false,
            }
        };
    }
   
    const totalCount = await Course.countDocuments(query);
    const courseAggregate = await Course.aggregate([
        {
            $match: query
        },
        {
            $lookup: { from: 'reviews', localField: '_id', foreignField: 'course', as: 'review' }
        },
        {
            $addFields: {
                averageRating: {
                    $avg: "$review.rating",
                },
            }
        },
        {
            $sort: sort
        },
        {
            $skip: (pageNumber - 1) * pageSize
        },
        {
            $limit: pageSize,
        },
        {
            $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }
        },
        {
            $lookup: { from: 'users', localField: 'teacher', foreignField: '_id', as: 'teacher' }
        },
        {
            $project: {
                document: '$$ROOT',
                numberOfReviews: { $size: "$review" },
            }
        },
    ]);

    const newestCoursesId = await getNewestCoursesId();
    const bestSellerCoursesId = await getBestSellerCoursesId();

    const courses = courseAggregate.map((element) => {
        const data = element.document;
        const newObj = {
            ...data,
            numberOfReviews: element.numberOfReviews,
            new: newestCoursesId.includes(`${data._id}`),
            bestseller: bestSellerCoursesId.includes(`${data._id}`)
        }
        if (!newObj.averageRating) newObj.averageRating = 0;
        else newObj.averageRating = newObj.averageRating.toFixed(2);
        newObj.category = newObj.category[0]?.name;
        newObj.teacher = newObj.teacher[0]?.fullname;
        delete newObj.review;
        delete newObj.__v;
        return newObj;
    });

    const totalPages = totalCount === 0 ? 1 : (pageSize === 0) ? 1 : Math.ceil(totalCount / pageSize);
    return {
        "pageSize": pageSize === 0 ? totalCount : pageSize,
        "pageNumber": pageNumber ? pageNumber : 1,
        "totalPages": totalPages,
        "totalResults": totalCount,
        "results": courses
    };
}

async function updateCourse(courseId, teacherId, body) {
    const { imageUrl, view, _id, createdAt, updatedAt, ...newData } = body;
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
    const enrollments = await enrollmentModel.getByStudentId(studentId);
    const results = await getCoursesByIdList(enrollments.map(item => item.course));
    return results;
}

async function getEnrollmentByStudentIdAndCourseId(studentId, courseId) {
    const enrollment = await enrollmentModel.get(courseId, studentId);
    return enrollment;
}

async function getPostedCourses(teacherId) {
    const courses = await Course.find({ teacher: teacherId });
    return courses;
}


async function addReview(courseId, userId, review, rating) {
    const enrollment = await enrollmentModel.get(courseId, userId);
    if (!enrollment) throw new ApiError(httpStatus.BAD_REQUEST, "Enrollment Not found");
    const exists = await reviewModel.exists(enrollment._id);
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, "Rated");
    const result = await reviewModel.add(enrollment._id, courseId, userId, review, rating);
    delete result.enrollment;
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
        .select('-__v -enrollment')
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

//get and format 
async function getCoursesByIdList(idList) {
    console.log(idList);
    const courseAggregate = await Course.aggregate([
        {
            $match: {
                _id: {
                    $in: idList
                }
            }
        },
        {
            $lookup: { from: 'reviews', localField: '_id', foreignField: 'course', as: 'review' }
        },
        {
            $addFields: {
                averageRating: {
                    $avg: "$review.rating",
                },
            }
        },
        {
            $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }
        },
        {
            $lookup: { from: 'users', localField: 'teacher', foreignField: '_id', as: 'teacher' }
        },
        {
            $addFields:
                { __order: { $indexOfArray: [idList, "$_id"] } }
        },
        { $sort: { __order: 1 } },
        {
            $project: {
                document: '$$ROOT',
                numberOfReviews: { $size: "$review" },
            }
        },
    ]);

    const newestCoursesId = await getNewestCoursesId();
    const bestSellerCoursesId = await getBestSellerCoursesId();

    const courses = courseAggregate.map((element) => {
        const data = element.document;
        const newObj = {
            ...data,
            numberOfReviews: element.numberOfReviews,
            new: newestCoursesId.includes(`${data._id}`),
            bestseller: bestSellerCoursesId.includes(`${data._id}`)
        }
        if (!newObj.averageRating) newObj.averageRating = 0;
        else newObj.averageRating = newObj.averageRating.toFixed(2);
        newObj.category = newObj.category[0]?.name;
        newObj.teacher = newObj.teacher[0]?.fullname;
        delete newObj.__order;
        delete newObj.review;
        delete newObj.__v;
        return newObj;
    });
    return courses
}

async function getNewestCoursesId() {
    const courses = await Course.find().sort({ createdAt: -1 }).limit(5).select('_id');
    const coursesId = courses.map((e) => e._id.toString());
    return coursesId;
}

async function getBestSellerCoursesId() {
    const aggregate = await Enrollment.aggregate([
        {
            $group: {
                _id: '$course',
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                count: -1,
            }
        },
        {
            $limit: 5
        },
    ]);
    const coursesId = aggregate.map((e) => e._id.toString());
    return coursesId;
}

module.exports = {
    createCourse,

    getAll,
    getCourseById,
    getCourses,
    getEnrollmentsByCourseId,
    getEnrollmentsByStudentId,
    getEnrollmentByStudentIdAndCourseId,
    getPopularCourses,
    getNewestCourses,
    getTopViewedCourses,
    getRelatedCourses,
    getReviews,
    getPostedCourses,
    getCoursesByIdList,

    updateCourse,
    enrollStudent,
    addReview,
    uploadCourseImage,

    deleteCourse,
}

