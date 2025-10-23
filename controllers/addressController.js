const axios = require('axios');
const User = require('../models/user');

exports.saveAddress = async (req, res) => {
  try {
    const user = req.user;
    const {
      fullName,
      streetAddress,
      apartment,
      townCity,
      state,
      zipcode,
      phoneNumber,
      emailAddress,
    } = req.body;

    if (!fullName || !streetAddress || !townCity || !zipcode || !state || !phoneNumber || !emailAddress) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // India Post API PIN code validation
    const response = await axios.get(`https://api.postalpincode.in/pincode/${zipcode}`);
    const data = response.data[0];

    if (data.Status !== "Success") {
      return res.status(400).json({ message: "Invalid PIN Code." });
    }

    const matched = data.PostOffice.some(
      (po) =>
        po.State.toLowerCase() === state.toLowerCase() &&
        po.District.toLowerCase() === townCity.toLowerCase()
    );

    if (!matched) {
      return res.status(400).json({
        message: `PIN Code does not match the selected State or City. It belongs to ${data.PostOffice[0].State}, ${data.PostOffice[0].District}`
      });
    }

    const newAddress = {
      fullName,
      streetAddress,
      apartment,
      townCity,
      state,
      zipcode,
      phoneNumber,
      emailAddress,
    };


    const alreadyExists = user.addresses.some(
      (addr) =>
        addr.fullName === newAddress.fullName &&
        addr.streetAddress === newAddress.streetAddress &&
        addr.apartment === newAddress.apartment &&
        addr.townCity === newAddress.townCity &&
        addr.state === newAddress.state &&
        addr.zipcode === newAddress.zipcode &&
        addr.phoneNumber === newAddress.phoneNumber &&
        addr.emailAddress === newAddress.emailAddress
    );

    if (!alreadyExists) {
      user.addresses.push(newAddress);
      await user.save();
    }





    res.status(200).json({ message: 'Address saved successfully', addresses: user.addresses });
  } catch (err) {
    console.error(' Save address error:', err);
    res.status(500).json({ message: 'Failed to save address', error: err.message });
  }
};

exports.getUserAddresses = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ addresses: user.addresses || [] });
  } catch (err) {
    console.error('Get address error:', err);
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = req.user;
    const addressId = req.params.id;

    await user.updateOne({
      $pull: {
        addresses: { _id: addressId }
      }
    });

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ message: 'Failed to delete address' });
  }
};
