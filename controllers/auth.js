module.exports.isAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }
}

module.exports.isNotAuth = (req, res, next) => {
    if (req.session.user) {
        res.redirect("/chat");
    } else {
        next();
    }
}

module.exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.user.admin) {
        next();
    } else {
        res.status(401).json({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}