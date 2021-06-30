const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const enrollmentSchema = mongoose.Schema(
    {
        course: { type: ObjectId, ref: 'Course', required: true },
        student: { type: ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
    },
);
enrollmentSchema.index({ course: 1, student: 1 }, { unique: true })

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

async function add(courseId, studentId) {
    const newEnrollment = new Enrollment({
        course: courseId,
        student: studentId,
    });
    await newEnrollment.save();
    return newEnrollment;
}

async function exists(courseId, studentId) {
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    return !!enrollment;
}

async function get(courseId, studentId) {
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    return enrollment;
}


async function getByCourseId(courseId) {
    const enrollments = await Enrollment.find({ course: courseId }).select('-__v')
        .populate('student', 'fullname email');
    return enrollments;
}

async function getByStudentId(studentId) {
    const enrollments = await Enrollment.find({ student: studentId }).select('-__v')
    .populate('course', 'name ');
    return enrollments;
}
async function countByCourseId(courseId) {
    const count = await Enrollment.countDocuments({ course: courseId })
    return count;
}
async function deleteCourseEnrollments(courseId) {
    const course = await Enrollment.deleteMany({ course: courseId });
    console.log(course);
    return course;
}

// async function countByStudent(courseId){
//     const count = await Enrollment.countDocuments({course:courseId})
//     return count;
// }

module.exports = {
    Enrollment,
    add,
    exists,
    getByCourseId,
    getByStudentId,
    get,
    countByCourseId,
    deleteCourseEnrollments,
};
