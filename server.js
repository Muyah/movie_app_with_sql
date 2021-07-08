const express = require("express");
const app = express();
const cors = require("cors");

const routed = require("./routes/routesmysql.user");
const routd = require("./routes/mainusers.mysq");

app.use(cors());
app.use(express.json());

app.use("/Api/V1/endUser", routed());
app.use("/Api/V1/User", routd());

const port = process.env.PORT || 4400;

app.use(express.json());


app.listen(port, (err) => {
	console.log(`db connected successfully \napp server running at port ${port}`);
});
