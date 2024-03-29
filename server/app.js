const express = require('express');
const router = require('./routers/root.router');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const Compression = require('compression');

const app = express();
app.use(cookieParser());
app.use(fileUpload());
app.use(express.json());
app.use(Compression());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use('/api', router);

module.exports = app;
