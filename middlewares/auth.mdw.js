const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { ROLE } = require('../utils/constants');
const userService = require('../services/user.service')

module.exports = (requiredRole) => (req, res, next) => {
    return new Promise(async (resolve, reject) => {
        const authorization = req.header('Authorization');
        if (!authorization) return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
        const token = authorization.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            if (!!requiredRole) {
                const user = await userService.getUserById(decoded.userId);
                if (!user) {
                    reject();
                }

                switch (requiredRole) {
                    case ROLE.TEACHER:
                        if (user.role !== ROLE.TEACHER) return res.status(httpStatus.FORBIDDEN).send('Forbidden');
                        break;

                    case ROLE.ADMIN:
                        if (user.role !== ROLE.ADMIN) return res.status(httpStatus.FORBIDDEN).send('Forbidden'); 
                        break;
                    default:
                }
            }
        } catch (err) {
            return res.status(httpStatus.BAD_REQUEST).send('Invalid Token');
        }
        resolve();
    }).then(() => next()).catch((err) => {
        return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
    });
};