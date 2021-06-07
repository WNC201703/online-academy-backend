const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { ROLE } = require('../utils/constants');
const userService = require('../services/user.service')
const tokenService = require('../services/token.service')

module.exports = (requiredRole) => (req, res, next) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token=tokenService.getAccessToken(req);
            const decoded = tokenService.verifyAndGetPayloadFromToken(token)

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
            reject(err);
        }
        resolve();
    }).then(() => next()).catch((err) => {
        console.log(err);
        return res.status(httpStatus.UNAUTHORIZED).send('Access Denied');
    });
};