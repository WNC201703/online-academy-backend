const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const enrollmentSchema = mongoose.Schema(
    {
        course:{ type: ObjectId, ref: 'Course'},
        student:{ type: ObjectId, ref: 'User'},
        createdAt: { type: Date, default: Date.now },
    },
);
enrollmentSchema.index({ course: 1, student: 1 }, { unique: true })

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

async function add(courseId,studentId) {
    const newEnrollment = new Enrollment({
        course: courseId,
        student:studentId,
    });
    await newEnrollment.save();
    return newEnrollment;
}

async function exists(courseId,studentId) {
    const enrollment = await Enrollment.findOne({student:studentId,course:courseId});
    return !!enrollment;
}

async function get(courseId,studentId) {
    const enrollment =  await Enrollment.findOne({student:studentId,course:courseId});
    return enrollment;
}


async function getByCoursesId(courseId) {
    const enrollments = await Enrollment.find({course:courseId});
    return enrollments;
}

async function getByStudentId(studentId) {
    const enrollments = await Enrollment.find({student:studentId});
    return enrollments;
}
async function countByCourseId(courseId){
    const count = await Enrollment.countDocuments({course:courseId})
    return count;
}

// async function countByStudent(courseId){
//     const count = await Enrollment.countDocuments({course:courseId})
//     return count;
// }

module.exports = {
    Enrollment,
    add,
    exists,
    getByCoursesId,
    getByStudentId,
    get,
    countByCourseId
};
