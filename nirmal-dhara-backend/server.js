const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// --- Middlewares ---
// Enable CORS for all routes
app.use(cors());
// Enable Express to parse JSON bodies (ONLY NEEDED ONCE)
app.use(express.json());

// --- Define Routes ---
app.get('/', (req, res) => res.send('Nirmal Dhara API Running'));
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./routes/auth'));

// Define the Port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));