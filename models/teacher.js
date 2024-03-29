const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const teacherSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User', required: true ,unique:true},
        name: { type: String, required: true },
        introduction: { type: String, required: true }
    },
);

const Teacher = mongoose.model('teacher', teacherSchema);

async function addTeacherProfile(userId, name, introduction) {
    const newTeacherProfile = new Teacher({
        user: userId,
        name: name,
        introduction: introduction,
    });

    await newTeacherProfile.save();
    return newTeacherProfile;
}

async function getProfile(userId) {
    const profile = await Teacher.findOne({user:userId});
    return profile;
}

async function updateProfile(userId, data) {

    const find = await Teacher.findOne({user:userId});
    console.log(find);
    if (!find) { 
        const profile = await addTeacherProfile(userId,data.name,data.introduction);
        return profile;
    }
    else {
        console.log(userId);
        const profile = await Teacher.findOneAndUpdate({user:userId},data);
        const newProfile=await getProfile(userId);
        return newProfile;
    }
}

async function deleteProfile(userId) {
    const result = await Teacher.findOneAndDelete(userId);
    return result;
}


module.exports = {
    Teacher,
    addTeacherProfile,
    getProfile,
    updateProfile,
    deleteProfile,
};
