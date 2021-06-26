const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const ratingSchema = mongoose.Schema(
    {
        course:{ type: ObjectId, ref: 'Course'},
        user:{ type: ObjectId, ref: 'User'},
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
ratingSchema.index({ course: 1, user: 1 }, { unique: true })

const Rating = mongoose.model('Rating', ratingSchema);

async function add(courseId,studentId) {
    const newRating = new Rating({
        course: courseId,
        student:studentId,
    });
    await newRating.save();
    return newRating;
}

async function exists(courseId,studentId) {
    const rating = await Rating.findOne({student:studentId,course:courseId});
    return !!rating;
}

async function getByCourseId(courseId) {
    const ratings = await Rating.find({course:courseId});
    return ratings;
}

async function getByStudentId(studentId) {
    const ratings = await Rating.find({student:studentId});
    return ratings;
}

module.exports = {
    Rating,
    add,
    exists,
    getByCourseId,
    getByStudentId,
};
