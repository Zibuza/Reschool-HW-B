const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true // FIXED: Added required validation
    },
    email: {
        type: String,
        required: true, // FIXED: Changed from "require" to "required"
        lowercase: true,
        unique: true // ADDED: Ensure unique emails
    },
    password: {
        type: String,
        required: true, // FIXED: Changed from "require" to "required"
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