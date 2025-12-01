const express = require("express");
const router = express.Router();
const controller = require("../controllers/profile.controller");

router.post("/", controller.create);
router.get("/:id", controller.getOne);

module.exports = router;
