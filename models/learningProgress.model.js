const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const learingProgressSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User', required: true },
        course: { type: ObjectId, ref: 'Course', required: true },
        lesson: { type: Number, required: true, min: 1 },
        createdAt: { type: Date, default: Date.now },
    },
);
learingProgressSchema.index({ course: 1, user: 1, lesson: 1 }, { unique: true })

const LearingProgress = mongoose.model('LearingProgress', learingProgressSchema);

async function add(userId, courseId,lessonNumber) {
    const item = new LearingProgress({
        user: userId,
        course: courseId,
        lesson: lessonNumber
    });
    await item.save();
    return item;
}

async function learned(userId, courseId, lessonNumber) {
    const lp = await LearingProgress.findOne({ user: userId, course: courseId, lesson: lessonNumber });
    return !!lp;
}

async function deleteLearningProgress(userId,courseId,lessonNumber) {
    const result = await LearingProgress.deleteOne({ user: userId, course: courseId, lesson: lessonNumber });
    return result;
}


module.exports = {
    LearingProgress,
    add,
    learned,
    deleteLearningProgress
};
