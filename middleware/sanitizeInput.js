function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return value;
  }

  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
        continue;
      }
      stripDangerousKeys(value[key]);
    }
  }

  return value;
}

// Strips MongoDB operator keys ($regex, $ne, $gt, ...) from request input so
// that untrusted JSON bodies/query strings can't be used to inject query
// operators into Mongoose queries (NoSQL injection).
const sanitizeRequestData = (req, res, next) => {
  if (req.body) {
    stripDangerousKeys(req.body);
  }

  if (req.query) {
    stripDangerousKeys(req.query);
  }

  next();
};

module.exports = { sanitizeRequestData };
