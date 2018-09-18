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
    const social = ["youtube", "instagram", "facebook", "linkedin", "github"];
    const entries = Object.entries(req.body);
    const profileFields = {};
    profileFields.social = {};
    for (const [index, value] of entries) {
      if (index === "skills") profileFields[index] = value.split(",");
      else if (social.includes(index)) profileFields.social[index] = value;
      else profileFields[index] = value;
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          // update
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          )
            .then(profile => res.json(profile))
            .catch();
        } else {
          Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
              if (profile) {
                errors.handle = "That handle already exists";
                res.status(400).json(errors);
              }
              // save profile
              new Profile(profileFields)
                .save()
                .then(profile => res.json(profile))
                .catch();
            })
            .catch();
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

module.exports = router;
