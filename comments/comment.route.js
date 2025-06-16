const router = require('express').Router();
const isAuth = require('../middlewares/isAuth.middleware');
const commentController = require('./comment.controller');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Blog comments
 */

/**
 * @swagger
 * /comments/{postId}:
 *   post:
 *     summary: Create a comment
 *     tags: [Comments]
 *     security: 
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Nice blog!"
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post('/:postId', isAuth, commentController.createComment);

/**
 * @swagger
 * /comments/{postId}:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments for the post
 */
router.get('/:postId', commentController.getCommentsByPost);

/**
 * @swagger
 * /comments/comment/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security: 
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 */
router.put('/comment/:commentId', isAuth, commentController.updateComment);

/**
 * @swagger
 * /comments/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security: 
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/comment/:commentId', isAuth, commentController.deleteComment);

module.exports = router;