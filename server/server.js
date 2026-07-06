import dotenv from "dotenv";
import app from "./app.js";
import connectDb from "./database/db.js"
import connectDB from "./database/db.js";

//load env variables 
dotenv.config();

//connect to mongodb
connectDB();

const PORT = process.env.PORT || 5000;

//start the express server 
app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});