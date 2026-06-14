const express = require('express');
const router = express.Router();
const {
  getSummary, getRevenueWeekly, getTopCustomers, getTopProducts,
} = require('../controllers/dashboard.controller');

router.get('/summary', getSummary);
router.get('/revenue-weekly', getRevenueWeekly);
router.get('/top-customers', getTopCustomers);
router.get('/top-products', getTopProducts);

module.exports = router;
