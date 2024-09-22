const express = require('express');
const { viewQuotations } = require('../controllers/invoiceController');

const router = express.Router();

// GET /api/invoices/view
router.get('/view', viewQuotations);

module.exports = router;
