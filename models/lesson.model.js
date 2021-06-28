const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const lessonSchema = mongoose.Schema(
    {
        course: { type: ObjectId, ref: 'Course', required: true },
        lessonNumber: { type: Number, required: true, min: 1 },
        name: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        videoUrl: {
            type: String,
            trim: true,
            default: ""
        },
        createdAt: { type: Date, default: Date.now },
    },
);
lessonSchema.index({ course: 1, lessonNumber: 1 }, { unique: true })

const Lesson = mongoose.model('Lesson', lessonSchema);

async function addLesson(courseId, name, description) {
    const lessons = await Lesson.find({ course: courseId }).sort({ lessonNumber: -1 }).limit(1);
    const lessonNumber = lessons.length === 0 ? 1 : Number(lessons[0].lessonNumber) + 1
    const newLesson = new Lesson({
        course: courseId,
        lessonNumber:lessonNumber,
        name: name,
        description: description
    });
    await newLesson.save();
    return newLesson;
}


module.exports = {
    Lesson,
    addLesson,
};
