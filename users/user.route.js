const { Router } = require("express");
const userModel = require("../models/user.model");
const { upload } = require("../config/clodinary.config");

const userRouter = Router();

// GET current user profile
userRouter.get('/', async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE user avatar
userRouter.put('/', upload.single('avatar'), async (req, res) => {
    try {
        const updateData = {};
        
        // If avatar file is uploaded
        if (req.file) {
            updateData.avatar = req.file.path;
        }
        
        // If profile info is being updated
        if (req.body.fullName) {
            updateData.fullName = req.body.fullName;
        }
        
        if (req.body.email) {
            // Check if email already exists
            const existingUser = await userModel.findOne({ 
                email: req.body.email, 
                _id: { $ne: req.userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            
            updateData.email = req.body.email;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.userId, 
            updateData, 
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Profile updated successfully',
            user: updatedUser 
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = userRouter;