const jwt = require('jsonwebtoken');

const getAccessToken = (req) => {
    const authorization = req.header('Authorization');
    if (!authorization) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
    const token = authorization.split(' ')[1];
    return token;
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
module.exports = {
    getPayloadFromToken,
    getPayloadFromRequest,
    getAccessToken,
    generateAccessToken
}