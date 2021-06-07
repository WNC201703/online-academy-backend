const jwt = require('jsonwebtoken');

const getAccessToken = (req) => {
    const authorization = req.header('Authorization');
    if (!authorization) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
    const token = authorization.split(' ')[1];
    return token;
}

const verifyAndGetPayloadFromToken = (token) => {
    console.log(token);
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
}
module.exports = {
    verifyAndGetPayloadFromToken,
    getAccessToken
}