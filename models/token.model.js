const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const { VERIFY_TOKEN_TYPE } = require('../utils/constants')
const tokenSchema = mongoose.Schema(
    {
        user: { type: ObjectId, ref: 'User', required: true },
        token: { type: String, required: true },
        expireAt: { type: Date, default: Date.now, index: { expires: 86400000 } },
        createdAt: { type: Date, default: Date.now },
        type: { type: String, default: VERIFY_TOKEN_TYPE.SIGN_UP },
        newEmail: { type: String }
    },
);

const Token = mongoose.model('Token', tokenSchema);

async function add(userId, token) {
    const newToken = new Token({
        user: userId,
        token: token
    });
    await newToken.save();
    return newToken;
}

module.exports = {
    Token,
    add
};
