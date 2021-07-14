const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const compeletedLessonSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User', required: true },
        course: { type: ObjectId, ref: 'Course', required: true },
        lesson: { type: ObjectId, ref: 'Lesson', required: true },
        createdAt: { type: Date, default: Date.now },
    },
);
compeletedLessonSchema.index({ course: 1, user: 1, lesson: 1 }, { unique: true })

const CompletedLesson = mongoose.model('CompletedLesson', compeletedLessonSchema);

async function add(userId, courseId, lessonId) {
    const item = new CompletedLesson({
        user: userId,
        course: courseId,
        lesson: lessonId
    });
    await item.save();
    return item;
}
async function get(userId, courseId) {
    const compeletedLessons = await CompletedLesson.find({ user: userId, course: courseId }).select('lesson -_id');
    return compeletedLessons;
}
async function exists(userId, courseId, lessonId) {
    const lp = await CompletedLesson.findOne({ user: userId, course: courseId, lesson: lessonId });
    return !!lp;
}

async function deleteCompletedLesson(userId, courseId, lessonId) {
    const result = await CompletedLesson.deleteOne({ user: userId, course: courseId, lesson: lessonId });
    return result;
}


module.exports = {
    CompletedLesson,
    add,
    get,
    exists,
    deleteCompletedLesson
};
