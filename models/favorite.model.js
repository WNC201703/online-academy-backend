const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const favoriteSchema = mongoose.Schema(
    {
        course: { type: ObjectId, ref: 'Course', required: true },
        user: { type: ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
    },
);
favoriteSchema.index({ course: 1, user: 1 }, { unique: true })

const Favorite = mongoose.model('Favorite', favoriteSchema);

async function add(userId, courseId) {
    const newFavorite = new Favorite({
        course: courseId,
        user: userId,
    });
    await newFavorite.save();
    return newFavorite;
}

async function get(userId, courseId) {
    const favorite = await Favorite.findOne({ user: userId, course: courseId });
    return favorite;
}

async function exists(userId, courseId) {
    const favorite = await Favorite.findOne({ user: userId, course: courseId });
    return !!favorite;
}

async function getByUserId(userId) {
    const favorites = await Favorite.find({ user: userId }).select('-__v')
        .populate('course', 'name ');
    return favorites;
}

async function deleteCourseFavorites(courseId) {
    const course = await Favorite.deleteMany({ course: courseId });
    console.log(course);
    return course;
}

async function deleteUserFavorite(userId, courseId) {
    const course = await Favorite.deleteOne({ user: userId, course: courseId });
    console.log(course);
    return course;
}

module.exports = {
    Favorite,
    add,
    get,
    exists,
    getByUserId,
    deleteUserFavorite,
    deleteCourseFavorites,
};
