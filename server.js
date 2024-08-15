// server.js
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure to true in production
}));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000/', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PATCH'], // Specify allowed methods
  credentials: true // If you want to include credentials like cookies
}));

app.use(bodyParser.json());

// MongoDB connection
const dbUri = process.env.MONGODB_URI || 'mongodb+srv://bhaveshsoni90:bhama90@carecrew.9r659.mongodb.net/?retryWrites=true&w=majority&appName=carecrew';
mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// Define schemas
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  location: String,
  password: String, // Plain text password (not recommended for production)
  species: String,
  breed: String,
  age: String,
  weight: String,
  medicalHistory: String,
  allergies: String,
  preferredFood: String,
  behavior: String,
  temperament: String
});

const providerSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  location: String,
  password: String, // Plain text password (not recommended for production)
  experience: String,
  certifications: String,
  servicesOffered: [String],
  availability: {
    sunday: Boolean,
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean
  },
  charges: String
});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String
});

const bookingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  service: String,
  days: [String],
  
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);
const Provider = mongoose.model('Provider', providerSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// API Routes
app.post('/signup', async (req, res) => {
  const { userType, ...userData } = req.body;

  try {
    if (userType === 'petOwner') {
      const newCustomer = new Customer(userData);
      await newCustomer.save();
      res.status(201).json({ message: 'Customer created successfully' });
    } else if (userType === 'petCareProvider') {
      const newProvider = new Provider(userData);
      await newProvider.save();
      res.status(201).json({ message: 'Provider created successfully' });
    } else {
      res.status(400).json({ message: 'Invalid user type' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

app.post('/login', async (req, res) => {
  const { userType, email, password } = req.body;

  try {
    let users;
    if (userType === 'petOwner') {
      users = await Customer.find({ email });
    } else if (userType === 'petCareProvider') {
      users = await Provider.find({ email });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users.find(u => u.password === password);

    if (user) {
      // Exclude the password before sending the response
      const { password, ...userData } = user.toObject();
      req.session.userId = user._id;
      req.session.userType = userType;
      return res.status(200).json({ message: 'Login successful', user: userData });
    }

    res.status(401).json({ message: 'Invalid password' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newContact = new Contact({ name, email, message });
    await newContact.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ message: 'Server error. Unable to send message.' });
  }
});

app.get('/profile', async (req, res) => {
  const userId = req.session.userId;
  const userType = req.session.userType;

  if (!userId || !userType) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    let user;
    if (userType === 'petOwner') {
      user = await Customer.findById(userId);
    } else if (userType === 'petCareProvider') {
      user = await Provider.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

app.get('/providers', async (req, res) => {
  try {
    const providers = await Provider.find();
    res.status(200).json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Error fetching providers' });
  }
});

app.post('/book', async (req, res) => {
  const { providerId, customerId, service, days } = req.body;

  try {
    const newBooking = new Booking({ providerId, customerId, service, days });
    await newBooking.save();
    res.status(200).json({ message: 'Booking successful' });
  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ message: 'Error processing booking' });
  }
});

app.get('/provider/:providerId/bookings', async (req, res) => {
  const { providerId } = req.params;

  try {
    const bookings = await Booking.find({ providerId }).populate('customerId', 'name');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
});

app.get('/customer/:customerId/bookings', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const bookings = await Booking.find({ customerId });

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this customer' });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
