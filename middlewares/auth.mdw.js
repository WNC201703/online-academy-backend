const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { ROLE } = require('../utils/constants');
const userService = require('../services/user.service')
const tokenService = require('../services/token.service')

module.exports = (requiredRoles) => (req, res, next) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token=tokenService.getAccessToken(req);
            const decoded = tokenService.getPayloadFromToken(token)

            if (!!requiredRoles) {
                const user = await userService.getUserById(decoded.userId);
                if (!user) {
                    reject();
                }
                
                console.log(requiredRoles);
                let forbidden=true;
                requiredRoles.forEach(requiredRole => {
                    if (user.role===requiredRole) {
                        forbidden=false;
                        return;
                    }
                });

                if (forbidden) return res.status(httpStatus.FORBIDDEN).send('Forbidden');
            }
        } catch (err) {
            reject(err);
        }
        resolve();
    }).then(() => next()).catch(async(err) => {
        if (err.name==='TokenExpiredError') {
            return res.status(httpStatus.UNAUTHORIZED).send('Access Denied: Token expired');
        }
        return res.status(httpStatus.UNAUTHORIZED).send(`Access Denied :${err.name}`);
    });
};