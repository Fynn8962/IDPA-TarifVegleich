require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/plans", require("./routes/plan.routes"));
app.use("/profiles", require("./routes/profile.routes"));
app.use("/calculate", require("./routes/calculate.routes"));

app.listen(process.env.PORT, () => {
  console.log("Server läuft auf Port " + process.env.PORT);
});
