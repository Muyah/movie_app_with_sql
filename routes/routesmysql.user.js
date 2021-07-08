const router = require("express").Router();
const db = require("../db/db");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Auth1 = require("../services/Users.Auth");
const { v4: uuidv4 } = require("uuid");
const { request } = require("http");
const route = () => {
	//user sign up

	router.post("/signUp", async (req, res) => {
		const salt = await bcrypt.genSalt(10);
		hashed_password = await bcrypt.hash(req.body.password, salt);

		let udata = [
			uuidv4(),
			req.body.uname,
			req.body.lname,
			req.body.email,
			hashed_password,
		];

		// sql
		let check_user_query = "SELECT * FROM users WHERE email=?";
		let insert_user_query =
			"INSERT INTO users (`Uid`, `Uname`, `Lname`, `email`, `Password`) VALUES (?)";

		db.query(check_user_query, [req.body.email], function (err, result, field) {
			if (result.length === 0) {
				db.query(insert_user_query, [udata], (err, data) => {
					if (err) throw err;
					res.json({
						message: `user email ${req.body.email} registered successfully`,
					});
				});
			} else {
				res.status(403).json({
					message: `user email ${req.body.email} is already registered`,
				});
			}
		});
	});

	// login user

	router.post("/Auth0", (req, res) => {
		let check_user_query = "SELECT * FROM users WHERE email=?";
		let input_password = req.body.password;
		db.query(check_user_query, [req.body.email], function (err, result, field) {
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
								_id: userFound.Uid,
								email: userFound.email,
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

	// buy ticket

	router.post("/ticket/:eventId/:MovieId", Auth1, (req, res) => {
		let addTicket_query =
			"INSERT INTO `tickets`(`TicketId`, `UserId`, `MovieId`, `EventId`, `Payed`, `PaymentRef`) VALUES (?)";
		let ticket = [
			uuidv4(),
			req.userData._id,
			req.params.MovieId,
			req.params.eventId,
			req.body.payed,
			req.body.PaymentRef,
		];

		db.query(addTicket_query, [ticket], (err, result) => {
			if (err) throw err;
			res.status(200).json({ message: `Ticket bought successfully` });
		});
	});

	// GET MY TICKETS
	router.get("/myTickets", Auth1, (req, res) => {
		let userId = req.userData._id;

		let get_query = `SELECT * FROM tickets WHERE UserId = ?`;
		db.query(get_query, [userId], (err, result) => {
			if (err) {
				res.status(500).json({ message: "An error Occured" });
			} else if (result.length < 1) {
				res.json({ message: "You do not have Tickets Yet" });
			} else {
				res.send(result);
			}
		});
	});

	// get one ticket

	router.get("/myTickets/:TicketId", Auth1, (req, res) => {
		let TicketId = req.params.TicketId;

		let get_query = `SELECT * FROM tickets WHERE TicketId = ?`;
		db.query(get_query, [TicketId], (err, result) => {
			if (err) {
				res.status(500).json({ message: "An error Occured" });
			} else if (result.length < 1) {
				res.json({ message: "You do not have Tickets Yet" });
			} else {
				res.send(result);
			}
		});
	});

	// Cancel Ticket

	router.get("/myTickets/Cancel/:TicketId", Auth1, (req, res) => {
		let TicketId = req.params.TicketId;

		let get_query = `UPDATE tickets SET is_cancelled = 1 WHERE TicketId = (?)`;
		db.query(get_query, [TicketId], (err, result) => {
			if (err) {
				res.status(500).json({ message: "An error Occured" });
			} else {
				res.json({ message: `Ticket id ${TicketId} canceled Successfully` });
			}
		});
	});

	// follow unfollow

	router.get("/follow/:Cinema_id", Auth1, (req, res) => {
		const MainUser = req.params.Cinema_id;
		const userId = req.userData._id;

		let check_follow_query =
			"SELECT * FROM `following` WHERE User_Id = (?) AND MainUser_Id = (?)";
		let follow_query =
			"INSERT INTO `following` (`Follow_Id`, `User_Id`, `MainUser_Id`) VALUES (?)";
		let Unfollow_query =
			"DELETE FROM `following` WHERE User_Id = (?) AND MainUser_Id = (?)";
		let data = [uuidv4(), userId, MainUser];

		let B = [userId, MainUser];

		// Check Follow
		db.query(check_follow_query, B, (err, result) => {
			if (err) {
				res.send(err);
			} else {
				if (result.length < 1) {
					db.query(follow_query, [data], (err, rest) => {
						let message = { message: `You followed  Successfully` };
						err ? res.send(err) : res.json(message);
					});
				} else {
					let message = { message: "You unfollowed Successfully" };
					db.query(Unfollow_query, B, (err, rls) => {
						err ? res.send(err) : res.json(message);
					});
				}
			}
		});
	});

	// my following
	router.get("/following", Auth1, (req, res) => {
		let userId = req.userData._id;

		let following_query =
			"SELECT `MainUser_Id` FROM `following` WHERE User_Id = (?)";

		db.query(following_query, [userId], (err, result) => {
			if (err) {
				res.status(500).json({ message: "An error occured" });
			} else if (result.length < 1) {
				res.json({ message: "You do not have any following yet" });
			} else {
				let ids = [];

				for (let i = 0; i < result.length; i++) {
					ids.push(result[i].MainUser_Id);
				}

				res.send(ids);
			}
		});
	});

	return router;
};

module.exports = route;
