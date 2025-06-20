const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('comment', commentSchema);
