require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 5001;
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
      password: hashedPassword 
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

    res.status(200).json({ token, user: { id: user._id, username: user.user_name, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
