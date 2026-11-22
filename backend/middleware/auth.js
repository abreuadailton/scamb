'use strict';

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Reads `Authorization: Bearer <token>`, verifies the JWT,
 * and injects `req.user = { id, email, name }`.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado.'
    });
  }
}

module.exports = authMiddleware;
