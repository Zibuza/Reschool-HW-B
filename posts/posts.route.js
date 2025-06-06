const { Router } = require("express");
const postModel = require("../models/post.model");
const userModel = require("../models/user.model");
const { isValidObjectId } = require("mongoose");
const { upload } = require("../config/clodinary.config");

const postRouter = Router();

// GET all posts with sorting support
postRouter.get('/', async (req, res) => {
    const { sort } = req.query;

    try {
        if (sort === 'most-liked' || sort === 'least-liked') {
            const sortOrder = sort === 'most-liked' ? -1 : 1;

            const posts = await postModel.aggregate([
                {
                    $addFields: {
                        likesCount: { $size: { $ifNull: ["$reactions.likes", []] } }
                    }
                },
                { $sort: { likesCount: sortOrder, _id: -1 } }
            ]);

            await postModel.populate(posts, { path: 'author', select: 'fullName email' });
            return res.status(200).json(posts);
        } 
        
        if (sort === 'date-asc') {
            const posts = await postModel.find().sort({ _id: 1 }).populate({ path: 'author', select: 'fullName email' });
            return res.status(200).json(posts);
        }
        
        if (sort === 'title-asc') {
            const posts = await postModel.find().sort({ title: 1 }).populate({ path: 'author', select: 'fullName email' });
            return res.status(200).json(posts);
        }

        // Default: sort by newest first
        const posts = await postModel.find().sort({ _id: -1 }).populate({ path: 'author', select: 'fullName email' });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE post with optional image
postRouter.post('/', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer/Cloudinary error:', err);
            return res.status(400).json({ message: 'File upload error', error: err.message });
        }

        const { content, title } = req.body;

        if (!req.userId) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }

        if (!content) {
            return res.status(400).json({ message: 'content is required' });
        }

        try {
            const postData = {
                content: content.trim(),
                title: title ? title.trim() : '',
                author: req.userId
            };

            if (req.file) {
                postData.image = req.file.path;
            }

            const newPost = await postModel.create(postData);

            await userModel.findByIdAndUpdate(req.userId, {
                $push: { posts: newPost._id }
            });

            res.status(201).json({
                message: "post created successfully",
                postId: newPost._id
            });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ message: 'Database error', error: error.message });
        }
    });
});

// GET post by ID
postRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "id is invalid" });
    }

    try {
        const post = await postModel.findById(id).populate({ path: 'author', select: 'fullName email' });

        if (!post) {
            return res.status(404).json({ message: 'not found' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE post
postRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "id is invalid" });
    }

    try {
        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'not found' });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(401).json({ message: 'you do not have permission' });
        }

        await postModel.findByIdAndDelete(id);

        await userModel.findByIdAndUpdate(req.userId, {
            $pull: { posts: id }
        });

        res.status(200).json({ message: "post deleted successfully" });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE post with optional image
postRouter.put('/:id', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ message: 'File upload error', error: err.message });
        }

        const { id } = req.params;
        const { title, content } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "id is invalid" });
        }

        try {
            const post = await postModel.findById(id);
            if (!post) {
                return res.status(404).json({ message: 'not found' });
            }

            if (post.author.toString() !== req.userId) {
                return res.status(401).json({ message: 'you do not have permission' });
            }

            const updateData = {
                title: title ? title.trim() : post.title,
                content: content ? content.trim() : post.content
            };

            if (req.file) {
                updateData.image = req.file.path;
            }

            await postModel.findByIdAndUpdate(id, updateData, { new: true });

            res.status(200).json({ message: "post updated successfully" });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
});

// REACT to post (like/dislike)
postRouter.post('/:id/reactions', async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;

    const supportedTypes = ['like', 'dislike'];
    if (!supportedTypes.includes(type)) {
        return res.status(400).json({ error: "wrong reaction type" });
    }

    try {
        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'post not found' });
        }

        const userIdStr = req.userId.toString();
        const alreadyLikedIndex = post.reactions.likes.findIndex(el => el.toString() === userIdStr);
        const alreadyDislikedIndex = post.reactions.dislikes.findIndex(el => el.toString() === userIdStr);

        if (type === 'like') {
            if (alreadyLikedIndex !== -1) {
                post.reactions.likes.splice(alreadyLikedIndex, 1);
            } else {
                post.reactions.likes.push(req.userId);
            }
            if (alreadyDislikedIndex !== -1) {
                post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
            }
        }

        if (type === 'dislike') {
            if (alreadyDislikedIndex !== -1) {
                post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
            } else {
                post.reactions.dislikes.push(req.userId);
            }
            if (alreadyLikedIndex !== -1) {
                post.reactions.likes.splice(alreadyLikedIndex, 1);
            }
        }

        await post.save();
        res.status(200).json({ message: 'reaction updated successfully' });
    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = postRouter;
