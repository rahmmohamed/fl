const express = require('express');
const router = express.Router();
const {
  getDeals, getDealById, createDeal, updateDeal, deleteDeal,
} = require('../controllers/deals.controller');

router.get('/', getDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

module.exports = router;
