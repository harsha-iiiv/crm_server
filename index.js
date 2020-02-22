const express = require("express");
const connectDB = require("./config/db.js");
const tickets = require("./routes/tickets");
const cors = require("cors");
const app = express();
connectDB();
app.use(cors());

app.use("/tickets", tickets);
app.get("/", (req, res) => {
  res.send("Hello from harsha");
});

port = 5000 | process.env.PORT;
app.listen(port, err => {
  console.log(`server listening on port ${port}`);
  if (err) {
    console.log(err);
  }
});
