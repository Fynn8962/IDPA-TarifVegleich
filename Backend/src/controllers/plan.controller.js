const Plan = require("../models/plan.model");

exports.getAll = async (req, res) => {
  const plans = await Plan.find();
  res.json(plans);
};

exports.create = async (req, res) => {
  const plan = await Plan.create(req.body);
  res.status(201).json(plan);
};

exports.update = async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(plan);
};

exports.remove = async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
