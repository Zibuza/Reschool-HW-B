const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true 
    },
    email: {
        type: String,
        required: true, 
        lowercase: true,
        unique: true 
    },
    password: {
        type: String,
        required: true, 
        select: false
    },
    posts: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'post',
        default: []
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
    }
}, {timestamps: true}) // ADDED: timestamps for createdAt and updatedAt

module.exports = mongoose.model('user', userSchema)