const Joi = require('joi');

exports.registerSchema = Joi.object({
    name: Joi.string().required().max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    phone: Joi.string().required()
});

exports.loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
    password: Joi.string().required().min(6),
    confirmPassword: Joi.string().required().valid(Joi.ref('password'))
});
