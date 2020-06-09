
const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
	await next();  // run all the other parts and then come here.
	clearHash(req.user.id);
}