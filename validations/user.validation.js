const Joi = require('joi')

const userSchema = Joi.object({
    fullName: Joi.string().min(4).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required()
})


module.exports = userSchema