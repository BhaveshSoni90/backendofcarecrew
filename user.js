const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define schemas
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  location: String,
  password: String,
  // Pet Owner fields
  species: String,
  breed: String,
  age: String,
  weight: String,
  medicalHistory: String,
  allergies: String,
  preferredFood: String,
  behavior: String,
  temperament: String,
});

const providerSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  location: String,
  password: String,
  // Pet Care Provider fields
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
  }
});

const Customer = mongoose.model('Customer', customerSchema);
const Provider = mongoose.model('Provider', providerSchema);

// Signup route
router.post('/signup', async (req, res) => {
  const { userType, ...userData } = req.body;

  try {
    if (userType === 'petOwner') {
      const newCustomer = new Customer(userData);
      await newCustomer.save();
      res.status(200).json({ message: 'Customer signed up successfully' });
    } else if (userType === 'petCareProvider') {
      const newProvider = new Provider(userData);
      await newProvider.save();
      res.status(200).json({ message: 'Provider signed up successfully' });
    } else {
      res.status(400).json({ message: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
