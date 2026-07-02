"use strict";

const express = require("express");
const path = require("path");
const cors = require("cors");
//const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const noCache = require("nocache");

const swaggerOptions = require("./swagger_options");
const swaggerSpec = swaggerJSDoc(swaggerOptions);

const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  CORS_ORIGIN,
} = require("../config");

const {
  AppError,
  httpCode,
  logger,
  errorHandler,
  sendJsonAndLogMiddleware,
} = require("../utils");

const appRoutes = require("../routes");

const app = express();

// Add sendJsonAndLog to res object
app.use(sendJsonAndLogMiddleware);

app.use(express.json()); // parsear POST em JSON
app.use(hpp()); // protection against parameter polution

// CORS middleware
const corsOrigin =
  CORS_ORIGIN === "*"
    ? "*"
    : CORS_ORIGIN.split(",").map((origin) => origin.trim());
app.use(cors({ origin: corsOrigin }));

// Helmet Protection
//app.use(helmet());
app.use(noCache());

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

// apply limit all requests
app.use(limiter);

app.use((req, res, next) => {
  const url = req.protocol + "://" + req.get("host") + req.originalUrl;

  logger.info(`${req.method} request`, {
    url,
    ip: req.ip,
  });
  return next();
});

// All routes used by the App
app.use("/api", appRoutes);

// Serve SwaggerDoc
app.use("/api/api_docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve JSDocs
app.use("/api/js_docs", express.static(path.join(__dirname, "..", "js_docs")));

// Serve Client
app.use(express.static(path.join(__dirname, "..", "build")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

app.use((req, res, next) => {
  const err = new AppError(
    `URL não encontrada para o método ${req.method}`,
    httpCode.NotFound
  );
  return next(err);
});

// Error handling
app.use((err, req, res, next) => {
  return errorHandler.log(err, res);
});

module.exports = app;
