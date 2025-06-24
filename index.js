const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const app = express();

const morgan = require("morgan");
const cors = require("cors");

app.use(morgan());
app.use(cors());
app.use(express.json());

const tempsRouter = require('./src/routers/temp.router');
app.use('/temperatures',tempsRouter);

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})