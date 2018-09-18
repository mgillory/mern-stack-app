const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

// load input validation
const validateCredentialsInput = require("../../validation/credentials");

const User = require("../../models/User");

// @router    POST api/users/register
// @desc      Register a user
// @access    Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateCredentialsInput(
    req.body,
    process.env.REGISTER
  );

  if (!isValid) return res.status(400).json(errors);

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200",
        r: "pg",
        d: "mm"
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log("promise save error ", err));
        });
      });
    }
  });
});

// @router    POST api/users/login
// @desc      Login user / returning JWT
// @access    Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateCredentialsInput(
    req.body,
    process.env.LOGIN
  );

  if (!isValid) return res.status(400).json(errors);

  const email = req.body.email;
  const password = req.body.password;

  // find user by email
  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }
    bcrypt
      .compare(password, user.password)
      .then(match => {
        if (match) {
          // generate token here
          const payload = { id: user.id, name: user.name, avatar: user.avatar };
          jwt.sign(
            payload,
            process.env.SECRET,
            { expiresIn: 3600 },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token
              });
            }
          );
        } else {
          errors.password = "Password incorret";
          return res.status(400).json(errors);
        }
      })
      .catch();
  });
});

// @router    GET api/users/current
// @desc      returns current user
// @access    Private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) =>
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    })
);

module.exports = router;
