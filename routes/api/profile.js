const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const validateProfileInput = require("../../validation/profile");

// @router    GET api/profile
// @desc      Gets current user profile
// @access    Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @router    GET api/profile/all
// @desc      Get all profiles
// @access    Public
router.get("/all", (req, res) => {
  const errors = {};

  Profile.find()
    .populate("name", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = "There are no profiles";
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => {
      res.status(404).json({ noprofile: "There are no profiles" });
    });
});

// @router    GET api/profile/handle/:handle
// @desc      Get profile by handle
// @access    Public
router.get("/handle/:handle", (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.profile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @router    GET api/profile/user/:user_id
// @desc      Get profile by user id
// @access    Public
router.get("/user/:user_id", (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.profile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

// @router    POST api/profile
// @desc      Creates or edit user profile
// @access    Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    if (!isValid) return res.status(400).json(errors);

    // get fields
    const social = ["youtube", "instagram", "facebook", "linkedin", "twitter"];
    const entries = Object.entries(req.body);
    const profileFields = {};
    profileFields.social = {};
    profileFields.user = req.user.id;
    for (const [index, value] of entries) {
      if (index === "skills") profileFields[index] = value.split(",");
      else if (social.includes(index)) profileFields.social[index] = value;
      else profileFields[index] = value;
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        console.log("profile", profile);
        if (profile) {
          // update
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          )
            .then(profile => res.json(profile))
            .catch(err => res.json(err));
        } else {
          Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
              if (profile) {
                errors.handle = "That handle already exists";
                res.status(400).json(errors);
              } else {
                // save profile
                new Profile(profileFields)
                  .save()
                  .then(profile => res.json(profile))
                  .catch(err => res.json(err));
              }
            })
            .catch(err => res.json(err));
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

module.exports = router;
