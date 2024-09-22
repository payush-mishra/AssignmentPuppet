const puppeteer = require('puppeteer');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

exports.addProductsAndGenerateInvoice = async (req, res) => {
    const { products } = req.body;
    console.log('products', products);
    
    try {
        // Insert products into the database
        const savedProducts = await Product.insertMany(products);
        
        // Calculate total with GST
        const total = savedProducts.reduce((acc, product) => acc + product.qty * product.rate * (1 + product.gst), 0);
        console.log('total', total);

        // Generate the PDF using Puppeteer
        const browser = await puppeteer.launch({
            cacheDir: 'D:/Assignment Backend/.cache', // path to your local Chrome installation
        });
        const page = await browser.newPage();
        
        // Create the HTML content dynamically
        const invoiceHTML = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px 12px; border: 1px solid #ccc; }
                    th { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <h1>Invoice</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>GST</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${savedProducts.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.qty}</td>
                                <td>${product.rate}</td>
                                <td>${(product.gst * 100)}%</td>
                                <td>${(product.qty * product.rate * (1 + product.gst)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="4" align="right"><strong>Grand Total</strong></td>
                            <td><strong>${total.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Set the content for the Puppeteer page
        await page.setContent(invoiceHTML);

        // Define the PDF file path
        const pdfPath = path.join(__dirname, `../invoices/invoice_${Date.now()}.pdf`);
        console.log('pdfPath', pdfPath);

        // Generate the PDF
        await page.pdf({ path: pdfPath, format: 'A4' });
        await browser.close();

        // Respond with the generated PDF path
        res.status(200).json({ message: "Invoice generated", pdfPath });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.viewQuotations = async (req, res) => {
    const userId = req.user.id;
    try {
        const quotations = fs.readdirSync(path.join(__dirname, '../invoices')).map(file => ({
            fileName: file,
            url: `/invoices/${file}`
        }));
        res.status(200).json(quotations);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

