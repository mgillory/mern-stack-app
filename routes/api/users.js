const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../../models/User");

// @router    GET api/users/test
// @desc      Tests users route
// @access    Public
router.get("/test", (req, res) => res.json({ msg: "User works" }));

// @router    POST api/users/register
// @desc      Register a user
// @access    Public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "email already exists" });
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
  const email = req.body.email;
  const password = req.body.password;

  // find user by email
  User.findOne({ email }).then(user => {
    if (!user) return res.status(404).json({ email: "user not found" });
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
          return res.status(400).json({ password: "password incorrect" });
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
