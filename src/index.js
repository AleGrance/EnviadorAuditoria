import express from "express";
import consign from "consign";
const helmet = require("helmet");

// Importar para leer los valores de entorno
require('dotenv').config()

const app = express();

// Usar modulo de seguridad HELMET
app.use(helmet());

app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

//cross access
var allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
  next();
};
app.use(allowCrossDomain);

consign({
  cwd: __dirname,
})
  .include("libs/config.js")
  .then("db.js")
  .then("libs/middlewares.js")
  .then("libs/boot.js")
  .then("routes")
  .into(app);
