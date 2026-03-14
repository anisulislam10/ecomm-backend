const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(', ');
        return next(new ApiError(400, errorMessage));
    }

    return next();
};

module.exports = validate;

