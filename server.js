const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, { dbName: "passport_system" })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// User Schema & Model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["applicant", "admin"], default: "applicant" }
});
const User = mongoose.model("User", userSchema);

// Passport Application Schema & Model
const applicationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    submittedAt: { type: Date, default: Date.now }
});
const Application = mongoose.model("Application", applicationSchema);

// Serve Pages
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/apply", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "apply.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ✅ Dynamic User Panel - Show Approved Applications without Login
app.get("/user-panel", async (req, res) => {
    try {
        const applications = await Application.find({ status: "Approved" }); // Fetch only approved applications
        let html = `
        <html>
        <head>
            <title>User Panel</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                h1 { color: #333; }
                .button { padding: 10px 20px; background: #007bff; color: white; border: none; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Approved Applications</h1>
            <table>
                <tr><th>Name</th><th>Email</th><th>Status</th></tr>`;
                
        applications.forEach(app => {
            html += `<tr><td>${app.name}</td><td>${app.email}</td><td>${app.status}</td></tr>`;
        });

        html += `</table>
            <br>
            <a class="button" href="/apply">Back to Apply Page</a>
        </body>
        </html>`;
        
        res.send(html); // ✅ Render as HTML
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error!");
    }
});

// Register API
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.json({ message: "Registration successful!", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// Login API
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found!", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials!", success: false });
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful!", success: true, token, redirect: user.role === "admin" ? "/admin" : "/apply" });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// Apply for Passport API
app.post("/api/apply", async (req, res) => {
    const { userId, name, email } = req.body;
    
    try {
        const application = new Application({ userId, name, email });
        await application.save();
        res.json({ message: "Application submitted successfully!", success: true, redirect: "/admin" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// Admin Panel - Get All Applications
app.get("/api/admin/applications", async (req, res) => {
    try {
        const applications = await Application.find();
        res.json({ applications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// Approve or Reject Application API
app.post("/api/admin/update-status", async (req, res) => {
    const { applicationId, status } = req.body;
    
    try {
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found!", success: false });
        }

        application.status = status;
        await application.save();
        
        res.json({ message: `Application ${status} successfully!`, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// ✅ Fetch User's Approved Applications (Optional API - If needed to fetch per user basis with token)
app.get("/api/user/applications", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Unauthorized!", success: false });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const applications = await Application.find({ userId: decoded.userId, status: "Approved" });
        res.json({ applications, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!", success: false });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});



