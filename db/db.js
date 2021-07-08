const mysql = require("mysql");
const con = mysql.createConnection({
	host: "localhost",
	user: "Muya",
	password: "Reinsheart31",
	database: "cinema",
});

con.connect(function (err) {
	if (err) {
		console.error("error connecting: " + err.stack);
		return;
	} else {
		console.log(`connected to db as id  ${con.threadId}`);
	}
});

module.exports = con;
