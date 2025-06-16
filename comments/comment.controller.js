const Comment = require('../models/comment.model');
const Post = require('../models/post.model');

exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = new Comment({ 
      text, 
      post: postId, 
      author: req.userId 
    });
    
    await comment.save();
    
    
    await comment.populate('author', 'fullName email');
    
    res.status(201).json(comment);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Error fetching comments' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.userId)
      return res.status(403).json({ error: 'Unauthorized' });

    comment.text = text;
    await comment.save();
    
    
    await comment.populate('author', 'fullName email');
    
    res.json(comment);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId).populate('post');

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAuthor = comment.author.toString() === req.userId;
    const isPostOwner = comment.post.author.toString() === req.userId;

    if (!isAuthor && !isPostOwner)
      return res.status(403).json({ error: 'Unauthorized' });

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};