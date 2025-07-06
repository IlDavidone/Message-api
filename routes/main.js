const express = require('express');
const loginRouter = require('./login');
const registrationRouter = require('./registration')
const logoutRouter = require('./logout');
const main = express();

//main route = http://domain/api/v1/...

main.use('/authentication', loginRouter);
main.use('/authentication', registrationRouter);
main.use('/authentication', logoutRouter);

module.exports = main;