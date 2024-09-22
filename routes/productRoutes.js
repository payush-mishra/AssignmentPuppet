const express = require('express');
const { addProductsAndGenerateInvoice } = require('../controllers/invoiceController');

const router = express.Router();

// POST /api/products/add
router.post('/add', addProductsAndGenerateInvoice);

module.exports = router;
