const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
