const { Router } = require("express");
const userSchema = require("../validations/user.validation");
const userModel = require("../models/user.model");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const isAuth = require("../middlewares/isAuth.middleware");
require('dotenv').config()

const authRouter = Router()

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter JWT token obtained from sign-in endpoint
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *             required:
 *               - fullName
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user registered successfully"
 *       400:
 *         description: Validation error or user already exists
 */
authRouter.post('/sign-up', async (req, res) => {
    const { error } = userSchema.validate(req.body || {});
    if (error) {
        console.log('Joi validation error:', error.details);
        return res.status(400).json(error);
    }

    const { fullName, email, password } = req.body;

    try {
        const existUser = await userModel.findOne({ email });
        if (existUser) {
            return res.status(400).json({ message: 'user already exist' });
        }

        const hashedPass = await bcrypt.hash(password, 10);
        await userModel.create({ fullName, password: hashedPass, email });
        console.log('User registered');
        res.status(201).json({ message: "user registered successfully" });
    } catch (err) {
        console.error('Sign-up error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: JWT token to use for authenticated requests
 *       400:
 *         description: Invalid credentials or missing fields
 *       500:
 *         description: Server error
 */
authRouter.post('/sign-in', async (req, res) => {
    const {email, password} = req.body
    if(!email || !password) {
        return res.status(400).json({message: 'email and password is required'})
    }

    try {
        const existUser = await userModel.findOne({email}).select('password role')
        if(!existUser){
            return res.status(400).json({message: 'email or password is invalid'})
        }

        const isPassEqual = await bcrypt.compare(password, existUser.password)
        if(!isPassEqual){
            return res.status(400).json({message: 'email or password is invalid'})
        }

        const payload = {
            userId: existUser._id,
            role: existUser.role
        }

        const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'})

        res.json({token})
    } catch (err) {
        console.error('Sign-in error:', err);
        res.status(500).json({ message: 'Server error' });
    }
})

/**
 * @swagger
 * /auth/current-user:
 *   get:
 *     summary: Get current authenticated user
 *     description: |
 *       Returns the profile of the currently authenticated user. 
 *       Requires a valid JWT token in the Authorization header.
 *       
 *       **Authentication Required:**
 *       - Include JWT token in Authorization header as: `Bearer <your-jwt-token>`
 *       - Token is obtained from successful sign-in
 *       - No additional parameters needed - user is identified from token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     responses:
 *       200:
 *         description: Current user data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64a7b8c9d1e2f3g4h5i6j7k8"
 *                   description: User's unique identifier
 *                 fullName:
 *                   type: string
 *                   example: "John Doe"
 *                   description: User's full name
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *                   description: User's email address
 *                 role:
 *                   type: string
 *                   example: "user"
 *                   description: User's role in the system
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:30:00Z"
 *                   description: Account creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:30:00Z"
 *                   description: Last update timestamp
 *       401:
 *         description: Unauthorized - Invalid, expired, or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. No token provided."
 *       404:
 *         description: User not found - Token valid but user doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
authRouter.get('/current-user', isAuth, async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Get current user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
})

module.exports = authRouter