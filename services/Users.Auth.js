const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports = (req, res, next) => {
	try {
		let privatekey = fs.readFileSync("./private.pem", "utf8");
		const token = req.headers.authorization.split(" ")[1];
		const decoded = jwt.verify(token, privatekey);
		req.userData = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Auth Failed" });
	}
};
