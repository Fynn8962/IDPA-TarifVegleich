const Plan = require("../models/plan.model");
const pricingService = require("../services/pricing.service");

exports.calculate = async (req, res) => {
  const user = req.body;

  const plans = await Plan.find();

  const results = plans.map(plan => {
    const cost = pricingService.calculateCost(plan, user);
    const reason = pricingService.getReason(plan, user);
    return { plan, cost, reason };
  });

  results.sort((a, b) => a.cost - b.cost);

  res.json(results.slice(0, 3));
};
