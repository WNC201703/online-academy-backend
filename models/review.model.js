const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const reviewSchema = mongoose.Schema(
    {
        user:{ type: ObjectId, ref: 'User'},
        course:{ type: ObjectId, ref: 'Course'},
        review: {
            type: String,
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
    },
);
reviewSchema.index({ course: 1, user: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema);

async function add(courseId,studentId) {
    const newReview = new Review({
        course: courseId,
        student:studentId,
    });
    await newReview.save();
    return newReview;
}

async function exists(courseId,studentId) {
    const review = await Review.findOne({student:studentId,course:courseId});
    return !!review;
}

async function getByCourseId(courseId) {
    const reviews = await Review.find({course:courseId});
    return reviews;
}

async function getByStudentId(studentId) {
    const reviews = await Review.find({student:studentId});
    return reviews;
}

module.exports = {
    Review,
    add,
    exists,
    getByCourseId,
    getByStudentId,
};
