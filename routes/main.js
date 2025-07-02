const express = require('express');
const loginRouter = require('./login');
const registrationRouter = require('./registration')
const logoutRouter = require('./logout');
const chatRouter = require('./chat');
const main = express();

main.use('/', loginRouter);
main.use('/', registrationRouter);
main.use('/', logoutRouter);
main.use('/', chatRouter);

module.exports = main;