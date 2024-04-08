const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/convert', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'Invalid URL' });
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);

        const screenshots = [];
        for (let i = 0; i < 5; i++) {
            const screenshotPath = `screenshot-${i + 1}.png`;
            await page.screenshot({ path: screenshotPath });
            screenshots.push(screenshotPath);
        }

        await browser.close();

        const output = fs.createWriteStream('app.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            console.log('Archive created successfully');
            res.status(200).json({ success: true, downloadLink: '/download/app.zip' });
        });

        archive.pipe(output);
        screenshots.forEach(screenshot => {
            archive.file(screenshot, { name: path.basename(screenshot) });
        });
        archive.finalize();
    } catch (error) {
        console.error('Conversion Error:', error);
        res.status(500).json({ success: false, error: 'Conversion failed' });
    }
});

app.use('/download', express.static('public'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});