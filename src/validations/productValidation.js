const Joi = require('joi');

exports.createProductSchema = Joi.object({
    name: Joi.string().required().max(100),
    description: Joi.string().required().max(2000),
    price: Joi.number().required().min(0),
    category: Joi.string().required(),
    stock: Joi.number().required().min(0),
    variants: Joi.array().items(
        Joi.object({
            _id: Joi.string(),
            size: Joi.string(),
            color: Joi.string(),
            price: Joi.number(),
            stock: Joi.number()
        })
    ),
    specifications: Joi.array().items(
        Joi.object({
            _id: Joi.string(),
            key: Joi.string().required(),
            value: Joi.string().required()
        })
    ),
    discount: Joi.number().min(0).max(100),
    featured: Joi.boolean(),
    isHero: Joi.boolean(),
    brand: Joi.string().allow('', null)
});

exports.updateProductSchema = Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().max(2000),
    price: Joi.number().min(0),
    category: Joi.string(),
    stock: Joi.number().min(0),
    variants: Joi.array().items(
        Joi.object({
            _id: Joi.string(),
            size: Joi.string(),
            color: Joi.string(),
            price: Joi.number(),
            stock: Joi.number()
        })
    ),
    specifications: Joi.array().items(
        Joi.object({
            _id: Joi.string(),
            key: Joi.string().required(),
            value: Joi.string().required()
        })
    ),
    discount: Joi.number().min(0).max(100),
    featured: Joi.boolean(),
    isHero: Joi.boolean(),
    brand: Joi.string().allow('', null)
});
