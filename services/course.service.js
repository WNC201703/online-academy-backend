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
    const aggregate = await Enrollment.aggregate([
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

    const courses = await Course.find({
        _id: {
            $in: aggregate.map(item => item._id)
        }
    })
        .select('-__v')
        .populate('teacher', 'fullname')
        .populate('category', 'name');

    let coursesReview = {};
    aggregate.forEach(element => {
        coursesReview[element._id] = {
            averageRating: element.averageRating,
            numberOfReviews: element.numberOfReviews
        };
    });

    let results = [];
    courses.forEach(element => {
        const id = element._id;
        const reviewObj = coursesReview[id];
        let data = element._doc;
        data.teacher = data.teacher.fullname;
        data.category = data.category.name;
        results.push({
            ...data,
            averageRating: reviewObj ? reviewObj.averageRating : 0,
            numberOfReviews: reviewObj ? reviewObj.numberOfReviews : 0,
        });
    });
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
    let regex = new RegExp(keyword, 'i');
    let obj = {};
    if (keyword) obj['name'] = regex;
    if (categories) obj['category'] = { '$in': categories.map(item => item._id) };
    const totalCount = await Course.countDocuments(obj);
    const courseAggregate = await Course.aggregate([
        {
            $match: obj
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
            $limit: pageSize,
        },
        {
            $skip: (pageNumber - 1) * pageSize
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
    const courses = courseAggregate.map((element) => {
        const newObj = {
            ...(element.document), numberOfReviews: element.numberOfReviews
        }
        if (!newObj.averageRating) newObj.averageRating = 0;
        newObj.category=newObj.category[0]?.name;
        newObj.teacher=newObj.teacher[0]?.fullname;
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

async function getCoursesByIdList(idList){
    const courseAggregate = await Course.aggregate([
        {
            $match: {
              _id:{
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
            $sort:{
                createdAt:1
            }
        },
        {
          $project: {
              document: '$$ROOT',
              numberOfReviews: { $size: "$review" },
          }
      },
      ]);

      const courses = courseAggregate.map((element) => {
        const newObj = {
            ...(element.document), 
            numberOfReviews: element.numberOfReviews
        }
        if (!newObj.averageRating) newObj.averageRating = 0;
        newObj.category=newObj.category[0]?.name;
        newObj.teacher=newObj.teacher[0]?.fullname;
        delete newObj.review;
        delete newObj.__v;
        return newObj;
    });
    return courses
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
    getPostedCourses,
    getCoursesByIdList,

    updateCourse,
    enrollStudent,
    addReview,
    uploadCourseImage,

    deleteCourse,
}

