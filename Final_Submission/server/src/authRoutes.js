const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { verifyToken, JWT_SECRET } = require('./middleware/auth');

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required (username, email, password)'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check email format
        if (!/@(user|admin|superadmin)$/.test(email)) {
            return res.status(400).json({
                error: 'Email must end with @user, @admin, or @superadmin'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
            // role is auto-set based on email domain in pre-validate hook
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Error creating user',
            details: error.message
        });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        // Validation
        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                error: 'Username/email and password are required'
            });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { email: usernameOrEmail.toLowerCase() },
                { username: usernameOrEmail.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is deactivated. Contact administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Error during login',
            details: error.message
        });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                lastLogin: req.user.lastLogin,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Error fetching user data'
        });
    }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // In a JWT setup, logout is typically handled client-side by removing the token
        // You could implement token blacklisting here if needed
        res.json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error during logout'
        });
    }
});

module.exports = router;
