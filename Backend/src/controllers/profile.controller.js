const Profile = require("../models/profile.model");

exports.create = async (req, res) => {
  const profile = await Profile.create(req.body);
  res.status(201).json(profile);
};

exports.getOne = async (req, res) => {
  const profile = await Profile.findById(req.params.id);
  res.json(profile);
};
