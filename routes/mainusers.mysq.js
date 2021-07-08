const router = require("express").Router();
const db = require("../db/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
var moment = require("moment");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const AuthO = require("../services/MainUser.Auth");

const route = () => {
	// storage
	const storage = multer.diskStorage({
		destination: "images",
		filename: function (req, file, cb) {
			cb(
				null,
				file.fieldname +
					"-cinemax-" +
					Date.now() +
					path.extname(file.originalname)
			);
		},
	});

	// init upload

	const upload = multer({
		storage: storage,
	}).array("images");

	// upload image
	router.post("/image/:movieId", (req, res) => {
		let id = req.params.movieId;

		upload(req, res, (err) => {
			let endresult = [];
			if (err) {
				res.status(500);
			} else {
				let names = [];
				for (let i = 0; i < req.files.length; i++) {
					names.push(req.files[i].filename);
				}

				let query_add_images =
					"INSERT INTO poster_images (poster_id, poster_path, movie_id) VALUES ?";
				let num = names.length;
				let dt = [];
				for (let j = 0; j < names.length; j++) {
					// let one = `"${uuidv4()}","${names[j]}","${req.params.movieId}"`;

					dt.push([`${uuidv4()}`, `${names[j]}`, `${id}`]);
				}

				db.query(query_add_images, [dt], (err, result) => {
					if (err) {
						res.send(err);
					} else {
						let nim = result.affectedRows;
						res.json({ message: `Affected Rows:${nim}` });
					}
				});
			}
		});
	});

	//user sign up

	router.post("/signUp", async (req, res) => {
		const salt = await bcrypt.genSalt(10);
		hashed_password = await bcrypt.hash(req.body.Password, salt);

		let udata = [uuidv4(), req.body.Uname, req.body.Email, hashed_password];

		// sql
		let check_user_query = "SELECT * FROM mainusers WHERE email=?";
		let insert_user_query =
			"INSERT INTO mainusers (`UserMainId`, `Uname`, `Email`, `Password`) VALUES (?)";

		db.query(check_user_query, [req.body.Email], function (err, result, field) {
			if (result.length === 0) {
				db.query(insert_user_query, [udata], (err, data) => {
					if (err) throw err;
					res.json({
						message: `user email ${req.body.Email} registered successfully`,
					});
				});
			} else {
				res.status(403).json({
					message: `user email ${req.body.Email} is already registered`,
				});
			}
		});
	});

	// login user

	router.post("/Auth0", (req, res) => {
		let check_user_query = "SELECT * FROM mainusers WHERE email=?";
		let input_password = req.body.Password;
		db.query(check_user_query, [req.body.Email], function (err, result, field) {
			if (result.length === 0) {
				res.send("Login Error");
			} else {
				let userFound_password = result[0].Password;
				let userFound = result[0];

				bcrypt.compare(input_password, userFound_password, (err, result) => {
					if (err) {
						return res.status(500).json({
							message: "Auth Failed",
						});
					}
					if (result) {
						let privatekey = fs.readFileSync("./private.pem", "utf8");
						let token = jwt.sign(
							{
								_id: userFound.UserMainId,
								email: userFound.Email,
								name: userFound.Uname,
							},
							privatekey,
							{
								algorithm: "HS256",
								expiresIn: "1h",
							}
						);

						return res.status(200).json({
							message: "Auth Successful",
							token: token,
						});
					} else
						return res.status(401).json({
							message: "Auth Failed",
						});
				});
			}
		});
	});

	// Add Movie

	router.post("/addMovie", AuthO, (req, res) => {
		upload(req, res, (err) => {
			const body = JSON.parse(JSON.stringify(req.body));
			let addmovie_query =
				"INSERT INTO movies (`MovieId`, `Title`, `Genre`, `ReleaseDate`,`Description`,`Category`) VALUES (?)";
			let check_Movie_query = "SELECT * FROM movies WHERE Title= ?";
			let id = uuidv4();

			// const body = JSON.parse(JSON.stringify(req.body));

			let movie = [
				id,
				body.Title,
				body.Genre,
				body.ReleaseDate,
				body.Description,
				body.Category,
			];
			let endresult = [];
			if (err) {
				res.status(500);
			} else {
				let names = [];
				for (let i = 0; i < req.files.length; i++) {
					names.push(req.files[i].filename);
				}

				//  add movie
				db.query(
					check_Movie_query,
					[req.body.Title],
					function (err, result, field) {
						if (result.length === 0) {
							console.log(id);
							db.query(addmovie_query, [movie], (err, data) => {
								let message = [];
								if (err) throw err;
								let query_add_images =
									"INSERT INTO poster_images (poster_id, poster_path, movie_id) VALUES ?";
								let num = names.length;
								let dt = [];
								for (let j = 0; j < names.length; j++) {
									// let one = `"${uuidv4()}","${names[j]}","${req.params.movieId}"`;
									console.log(id);
									dt.push([`${uuidv4()}`, `${names[j]}`, `${id}`]);
								}

								db.query(query_add_images, [dt], (err, result) => {
									if (err) {
										res.send(err);
									} else {
										let nim = result.affectedRows;

										res.json({
											message: `movie ${body.Title} registered successfully and  Affected Rows:${nim}} `,
										});
									}
								});
							});
						} else {
							res.send(`Movie ${req.body.Title} is already registered`);
						}
					}
				);
			}
		});
	});

	// Add Event

	router.post("/Event/:MovieId/:Ownerid", AuthO, (req, res) => {
		let addEvent_Query =
			"INSERT INTO `event`(`EventId`, `MovieId`, `Venue`, `Discount`, `Price`, `OwnerId`, `Tstamp`) VALUES (?)";
		let check_Event_query = `SELECT * FROM event WHERE OwnerId = "${req.params.Ownerid}" AND Tstamp = ${req.body.Tstamp}`;
		let Event = [
			uuidv4(),
			req.params.MovieId,
			req.body.Venue,
			req.body.Discount,
			req.body.Price,
			req.params.Ownerid,
			req.body.Tstamp,
		];

		db.query(check_Event_query, function (err, result, field) {
			if (result.length === 0) {
				db.query(addEvent_Query, [Event], (err, data) => {
					if (err) throw err;
					res.json({
						message: `user email ${req.params.MovieId} registered successfully`,
					});
				});
			} else {
				let this_date = moment(req.body.Tstamp * 1000).format(
					"DD/MM/YYYY hh:mm a "
				);
				res.status(403).json({
					message: `Sorry you have an event on ${this_date}`,
				});
			}
		});
	});

	return router;
};

module.exports = route;
