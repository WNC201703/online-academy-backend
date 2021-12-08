const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const randomstring = require('randomstring');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const getAccessToken = (req) => {
    const authorization = req.header('Authorization');
    if (!authorization) throw new ApiError(httpStatus.UNAUTHORIZED,'Access Denied');
    const token = authorization.split(' ')[1];
    return token;
}

const getRefreshToken = (req) => {
    const refreshToken = req.header('refresh-token');
    return refreshToken;
}

const getPayloadFromToken = (token) => {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
}
const getPayloadFromRequest = (req) => {
    const token = getAccessToken(req);
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
}

function generateAccessToken(email, id, role) {
    const payload = {
        email: email,
        userId: id,
        role: role
    }
    return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '86400s' });
}

async function generateRefreshToken(userId) {
    const refreshToken = randomstring.generate(80);
    await userModel.addRefreshToken(userId, refreshToken);
    return refreshToken;
}

module.exports = {
    getPayloadFromToken,
    getPayloadFromRequest,
    getAccessToken,
    getRefreshToken,
    generateAccessToken,
    generateRefreshToken,
}