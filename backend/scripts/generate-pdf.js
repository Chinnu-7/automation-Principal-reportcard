const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF(uploadId, outputPath) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Construct the URL. In production/n8n, this would be the local server URL
        // We assume the server is running on localhost:3000
        const reportUrl = `http://localhost:3000/static/report.html?id=${uploadId}`;

        console.log(`Distilling PDF from: ${reportUrl}`);

        await page.goto(reportUrl, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Set viewport size for A4
        await page.setViewport({
            width: 794, // ~210mm at 96dpi
            height: 1123, // ~297mm at 96dpi
            deviceScaleFactor: 2
        });

        // Add a small delay to ensure animations and charts are fully rendered
        await new Promise(r => setTimeout(r, 2000));

        // Create PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        });

        console.log(`✅ PDF successfully generated at: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('❌ Error generating PDF:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// CLI usage: node generate-pdf.js <uploadId> <outputPath>
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node generate-pdf.js <uploadId> <outputPath>');
        process.exit(1);
    }

    const uploadId = args[0];
    const outputPath = path.resolve(args[1]);

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    generatePDF(uploadId, outputPath)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = generatePDF;
