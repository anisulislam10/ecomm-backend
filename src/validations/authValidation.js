const Joi = require('joi');

exports.registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6)
});

exports.loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().required().min(6)
});
