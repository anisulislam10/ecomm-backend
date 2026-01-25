const Joi = require('joi');

exports.createOrderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            product: Joi.string().required(),
            quantity: Joi.number().required().min(1),
            price: Joi.number().required()
        })
    ).required(),
    shippingAddress: Joi.string().required(),
    paymentMethod: Joi.string().valid('Stripe', 'COD').required(),
    itemsPrice: Joi.number().required(),
    taxPrice: Joi.number().required(),
    shippingPrice: Joi.number().required(),
    totalPrice: Joi.number().required()
});
