const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const reviewSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User' , required:true},
        course: { type: ObjectId, ref: 'Course', required:true },
        enrollment: { type: ObjectId, ref: 'Enrollment', unique: true , required:true},
        review: {
            type: String,
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
            min:0,
            max:10
        },
        createdAt: { type: Date, default: Date.now },
    },
);
reviewSchema.index({ course: 1, user: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema);

async function add(enrollmentId,courseId, userId,review,rating) {
    const newReview = new Review({
        course: courseId,
        user: userId,
        enrollment:enrollmentId,
        review:review,
        rating:rating
    });
    await newReview.save();
    return newReview;
}

async function exists(enrollmentId) {
    const review = await Review.findOne({ enrollment:enrollmentId });
    return !!review;
}

async function get() {
    const reviews = await Review.find();
    return reviews;
}

async function deleteCourseReviews(courseId) {
    const course=await Review.deleteMany({course:courseId});
    console.log(course);
    return course;
}

module.exports = {
    Review,
    add,
    exists,
    deleteCourseReviews,
};
