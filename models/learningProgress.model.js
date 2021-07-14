const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const learingProgressSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User', required: true },
        course: { type: ObjectId, ref: 'Course', required: true },
        lesson: { type: ObjectId, ref: 'Lesson', required: true  },
        createdAt: { type: Date, default: Date.now },
    },
);
learingProgressSchema.index({ course: 1, user: 1, lesson: 1 }, { unique: true })

const LearingProgress = mongoose.model('LearingProgress', learingProgressSchema);

async function add(userId, courseId,lessonId) {
    const item = new LearingProgress({
        user: userId,
        course: courseId,
        lesson: lessonId
    });
    await item.save();
    return item;
}

async function exists(userId, courseId, lessonId) {
    const lp = await LearingProgress.findOne({ user: userId, course: courseId, lesson: lessonId });
    return !!lp;
}

async function deleteLearningProgress(userId,courseId,lessonId) {
    const result = await LearingProgress.deleteOne({ user: userId, course: courseId, lesson: lessonId });
    return result;
}


module.exports = {
    LearingProgress,
    add,
    exists,
    deleteLearningProgress
};
