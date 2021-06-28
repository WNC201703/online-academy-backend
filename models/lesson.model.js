const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const lessonSchema = mongoose.Schema(
    {
        course:{ type: ObjectId, ref: 'Course',required:true},
        lessonNumber:{ type: int, required:true},
        name: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            default:""
        },
        videoUrl: {
            type: String,
            trim: true,
            default:""
        },
        createdAt: { type: Date, default: Date.now },
    },
);
lessonSchema.index({ course: 1, lessonNumber: 1 }, { unique: true })

const Lesson = mongoose.model('Lesson', lessonSchema);

async function addLesson(courseId,lessonNumber,name,description) {
    const newLesson = new Lesson({
        course: courseId,
        lessonNumber:lessonNumber,
        name:name,
        description:description
    });
    await newLesson.save();
    return newLesson;
}


module.exports = {
    Lesson,
    addLesson,
};
