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

const app = express();
let port = 5000;
const saltRounds = 10;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

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

const {spawn} = require('child_process');

app.post('/home', (req, res) => {
    const { text } = req.body;

    // Validate that the text field is provided and not empty
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: "The 'text' field is required and must be non-empty." });
    }

    // Spawn a Python process to run the model script
    const pythonProcess = spawn('python3', ['model.py']);

    // Send the input text to the Python script
    pythonProcess.stdin.write(JSON.stringify({ text }));
    pythonProcess.stdin.end();

    let output = '';

    // Capture the output from the Python script
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    // Handle errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error("Error from Python script:", data.toString());
    });

    // Send the processed result back to the client once the script completes
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const result = JSON.parse(output);
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ error: "Error parsing response from model." });
            }
        } else {
            res.status(500).json({ error: "Error processing text with the model." });
        }
    });
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

findAvailablePort(port).then((availablePort) => {
    writePortToConfig(availablePort);
    app.listen(availablePort, () => {
        console.log(`Server running on port ${availablePort}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});