/**
 * @file server.js
 * @description A Node.js API server for user authentication and profile management.
 * 
 * Purpose:
 * - This server provides endpoints for user authentication, signup, login, and profile management.
 * - It supports sending password reset links and resetting user passwords using secure JWT tokens.
 * - The server connects to a MongoDB database to store user credentials and profile data.
 * - A SendGrid integration is used for sending password reset emails.
 * 
 * Features:
 * - `/signup`: Allows users to sign up by providing a username, email, and password. The password is hashed before being stored.
 * - `/login`: Allows users to log in by providing either their email or username, and a password. A JWT token is returned on successful login.
 * - `/profile`: Updates the user's profile information (profile photo, phone number, location, and theme).
 * - `/forgot_password`: Sends a password reset link to the user's email.
 * - `/reset-password`: Resets the user's password using a secure reset token.
 * 
 * Key Functions:
 * - `connectDB()`: Connects to the MongoDB database.
 * - `findAvailablePort()`: Finds an available port to run the server on, checking if a given port is available.
 * - `writePortToConfig()`: Updates the configuration file (`config.json`) with the chosen port.
 * - `sendPasswordResetEmail()`: Sends a password reset email using SendGrid.
 * 
 * Dependencies:
 * - `express`: Web framework for building REST APIs.
 * - `bcrypt`: For securely hashing passwords.
 * - `jsonwebtoken`: For creating and verifying JWT tokens.
 * - `cors`: For handling cross-origin resource sharing (CORS).
 * - `mongodb`: For interacting with the MongoDB database.
 * - `@sendgrid/mail`: For sending emails via SendGrid.
 * - `fs`: For reading and writing the configuration file.
 * - `net`: For checking if a given port is available.
 * - `dotenv`: For loading environment variables (e.g., MongoDB URI, SendGrid API key).
 * 
 * Notes:
 * - The server uses MongoDB to store user credentials and other profile data (such as profile photo, phone number, location).
 * - The SendGrid API is used to send emails, including password reset links.
 * - The password reset link is valid for 1 hour.
 */

require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const net = require('net');
const fs = require('fs');
const config = require('./src/config.json');
const { spawn } = require('child_process');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
let port = 5000;
const saltRounds = 10;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
    }
}
connectDB();

app.post('/signup', async (req, res) => {
    try {
        const { user_name, email, password } = req.body;
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        const existingEmail = await collection.findOne({ email: email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        const existingUserName = await collection.findOne({ user_name: user_name });
        if (existingUserName) {
            return res.status(400).json({ message: "Username is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await collection.insertOne({
            user_name,
            email,
            password: hashedPassword,
            profile_photo: '', 
            phone_number: '',
            location: '',
            theme: 'system'
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to insert user" });
    }
});

app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        const user = await collection.findOne({
            $or: [{ email: identifier }, { user_name: identifier }]
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid email/username or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email/username or password" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.user_name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.user_name,
                email: user.email,
                profile_photo: user.profile_photo,
                phone_number: user.phone_number,
                location: user.location,
                theme: user.theme
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

app.post('/profile', async (req, res) => {
    try {
        const { userId, profile_photo, phone_number, location, theme } = req.body;
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    profile_photo: profile_photo,
                    phone_number: phone_number,
                    location: location,
                    theme: theme
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "No changes made or user not found." });
        }

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

app.post('/home', async (req, res) => {
    const { userId, theme, language } = req.body;

    try {
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    profile_photo,
                    phone_number,
                    location,
                    theme: theme,
                    language: language
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "No changes made or user not found." });
        }

        
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Failed to update settings" });
    }
});

// Function to generate and send password reset link
app.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    try {
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        // Check if user exists
        const user = await collection.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        // Generate a secure reset token with an expiration
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token valid for 1 hour
        );

        // Save the token temporarily in the user's record (optional: set expiration)
        await collection.updateOne(
            { _id: user._id },
            { $set: { resetToken, tokenExpiry: new Date(Date.now() + 3600000) } } // 1-hour expiry
        );

        // Send the reset email
        const resetLink = `http://localhost:${port}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetLink);

        res.status(200).json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error("Error generating reset token:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const saltRounds = 10;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        // Verify token by matching it with the stored token
        const user = await collection.findOne({ _id: new ObjectId(userId), resetToken: token });
        if (!user || new Date() > user.tokenExpiry) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        // Check if the new password is the same as the old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password must be different from the old password." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password and remove the reset token and expiry
        await collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", tokenExpiry: "" }
            }
        );

        res.status(200).json({ message: "Password reset successfully. Redirecting to login." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password. Please try again later." });
    }
});

app.get('/reset-password', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Invalid or missing token.");
    }

    // Redirect to the frontend app with the token as a query parameter
    res.redirect(`http://localhost:3000/reset-password?token=${token}`);
});

function findAvailablePort(initialPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(initialPort, () => {
            server.once('close', () => {
                port = initialPort;
                resolve(initialPort);
            });
            server.close();
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${initialPort} is in use, checking next one...`);
                resolve(findAvailablePort(initialPort + 1));
            } else {
                reject(err);
            }
        });
    });
}

function writePortToConfig(availablePort) {
    config.port = availablePort;

    fs.writeFile('./src/config.json', JSON.stringify(config, null, 2), (err) => {
        if (err) {
            console.error("Error writing to config.json", err);
        } else {
            console.log(`Updated config.json with port ${availablePort}`);
        }
    });
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

findAvailablePort(port).then((availablePort) => {
    writePortToConfig(availablePort);

    // Google Signup Strategy
    passport.use('google-signup', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${availablePort}/auth/google/signup/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log("Google Profile (Signup):", profile);
            const database = client.db("user_information");
            const collection = database.collection("user_credentials");

            // Check if email is already registered
            const existingUser = await collection.findOne({ email: profile.emails[0].value });
            
            if (existingUser) {
                return done(null, false, { message: 'The email associated with this Google account is already registered.' });
            }

            // If not, create a new user
            const newUser = {
                user_name: profile.displayName,
                email: profile.emails[0].value,
                password: '', // Not required for Google users
                profile_photo: profile.photos[0]?.value || '', // Use Google profile photo
                phone_number: '',
                location: '',
                theme: 'system',
            };

            const result = await collection.insertOne(newUser);

            // Fetch the inserted document using insertedId
            const insertedUser = await collection.findOne({ _id: result.insertedId });
            
            return done(null, insertedUser);

        } catch (error) {
            console.error("Google Signup Error:", error);
            return done(error, null);
        }
    }));

    // Google Login Strategy
    passport.use('google-login', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${availablePort}/auth/google/login/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log("Google Profile (Login):", profile);
            const database = client.db("user_information");
            const collection = database.collection("user_credentials");

            // Check if the user exists
            const existingUser = await collection.findOne({ email: profile.emails[0].value });

            if (!existingUser) {
                return done(null, false, { message: 'No account found with this Google email. Please sign up first.' });
            }

            // If user exists, return the user
            return done(null, existingUser);

        } catch (error) {
            console.error("Google Login Error:", error);
            return done(error, null);
        }
    }));

    app.listen(availablePort, () => {
        console.log(`Server running on port ${availablePort}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});

passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user._id); // Store only the user's `_id` in the session
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    console.log("Deserializing user with ID:", id);
    try {
        const database = client.db("user_information");
        const collection = database.collection("user_credentials");

        // Find the user by ID
        const user = await collection.findOne({ _id: new ObjectId(id) });

        if (!user) {
            return done(new Error("User not found"));
        }
        done(null, user); // Attach the user object to `req.user`
    } catch (error) {
        console.error("Error deserializing user:", error);
        done(error, null);
    }
});

// Separate Google authentication for signup
app.get('/auth/google/signup', passport.authenticate('google-signup', { scope: ['profile', 'email'] }));

app.get('/auth/google/signup/callback', (req, res, next) => {
    passport.authenticate('google-signup', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Redirect to signup page with error message in query string
            return res.redirect(`http://localhost:3000/signup?error=${encodeURIComponent(info.message)}`);
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error("Signup Login Error:", err);
                return next(err);
            }
            return res.redirect('http://localhost:3000/login');
        });
    })(req, res, next);
});

// Separate Google authentication for login
app.get('/auth/google/login', passport.authenticate('google-login', { scope: ['profile', 'email'] }));

app.get('/auth/google/login/callback', (req, res, next) => {
    passport.authenticate('google-login', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Redirect to login page with error message in query string
            return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(info.message)}`);
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error("Login Error:", err);
                return next(err);
            }
            return res.redirect('http://localhost:3000/home'); // Redirect to home page after successful login
        });
    })(req, res, next);
});

async function sendPasswordResetEmail(toEmail, resetLink) {
    const msg = {
        to: toEmail,
        from: process.env.EMAIL_USER, // Verified sender email in SendGrid
        subject: 'Password Reset Request',
        html: `<p>You requested a password reset.</p>
               <p>Click the link below to reset your password:</p>
               <a href="${resetLink}">${resetLink}</a>
               <p>This link is valid for 1 hour.</p>`
    };

    try {
        await sgMail.send(msg);
        console.log("Password reset email sent to:", toEmail);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Could not send reset email.");
    }
}