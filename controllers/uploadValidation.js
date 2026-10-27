// Cloudinary's uploader treats any string that isn't a recognized remote
// scheme as a local filesystem path and reads it off disk. Without this
// check, user-controlled input would let a client make the server upload
// arbitrary local files (e.g. .env) to the configured Cloudinary account.
const REMOTE_SOURCE_PATTERN = /^https?:\/\//i;
const DATA_URI_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

function isValidUploadSource(value) {
  return (
    typeof value === "string" &&
    (REMOTE_SOURCE_PATTERN.test(value) || DATA_URI_PATTERN.test(value))
  );
}

module.exports = { isValidUploadSource };
