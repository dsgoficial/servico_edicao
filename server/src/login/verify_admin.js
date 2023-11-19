"use strict";

const { AppError, asyncHandler, httpCode } = require("../utils");

const { db } = require("../database");

const validateToken = require("./validate_token");

// middleware para verificar se o usuário é administrador
const verifyAdmin = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization;

  const decoded = await validateToken(token);

  if (!decoded.uuid) {
    throw new AppError("Falta informação de usuário");
  }
  const response = await db.conn.oneOrNone(
    "SELECT administrador FROM dgeo.usuario WHERE uuid = $<usuarioUuid> and ativo IS TRUE",
    { usuarioUuid: decoded.uuid }
  );
  if (!response.administrador) {
    throw new AppError(
      "Usuário necessita ser um administrador",
      httpCode.Forbidden
    );
  }
  req.usuarioUuid = decoded.uuid;
  req.administrador = true;

  next();
});

module.exports = verifyAdmin;
