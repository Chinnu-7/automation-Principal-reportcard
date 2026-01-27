const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { db, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const generatePDF = require('./scripts/generate-pdf');

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for report card templates
const reportTemplateDir = path.resolve(__dirname, '../report card/Viswam/dist');
if (fs.existsSync(reportTemplateDir)) {
    app.use('/report-card', express.static(reportTemplateDir));
}

// Serve generated PDFs
const n8nDir = path.resolve(__dirname, 'n8n_files');
app.get('/generated-reports/:filename', (req, res) => {
    const filename = req.params.filename;
    // Basic sanitization
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).send('Invalid filename');
    }
    const filePath = path.join(n8nDir, filename);

    console.log(`[DEBUG] Request for: ${filename}`);
    console.log(`[DEBUG] Looking in: ${filePath}`);
    const exists = fs.existsSync(filePath);
    console.log(`[DEBUG] Exists? ${exists}`);

    if (exists) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Serve the root directory to access report.html
const rootDir = path.resolve(__dirname, '..');
app.use('/static', express.static(rootDir));

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

// Helper function to parse Excel file
function parseExcelFile(filePath) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        return data;
    } catch (error) {
        throw new Error('Failed to parse Excel file: ' + error.message);
    }
}

// Helper function to trigger n8n webhook
async function triggerN8nWebhook(webhookUrl, data) {
    try {
        if (!webhookUrl) {
            console.log('⚠️  n8n webhook URL is missing. Skipping webhook call.');
            console.log('Data that would be sent:', data);
            return { success: true, skipped: true };
        }

        const response = await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        return response.data;
    } catch (error) {
        console.error('n8n webhook error:', error.message);
        // Don't throw error - continue even if webhook fails
        return { success: false, error: error.message };
    }
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Upload Excel file
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { school_id, uploaded_by } = req.body;

        if (!school_id) {
            return res.status(400).json({ error: 'school_id is required' });
        }

        // Verify school exists
        const school = await db.getSchool(school_id);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Parse Excel file
        const filePath = req.file.path;
        let studentsData = parseExcelFile(filePath);

        if (!studentsData || studentsData.length === 0) {
            fs.unlinkSync(filePath); // Delete empty file
            return res.status(400).json({ error: 'Excel file is empty or invalid' });
        }

        // Filter out metadata rows (e.g., where ROLL NO is "Question ID")
        studentsData = studentsData.filter(row => {
            const rollKey = Object.keys(row).find(k => k.toUpperCase() === 'ROLL NO');
            return row[rollKey] !== 'Question ID';
        });

        // Create upload record
        const uploadId = await db.createUpload({
            school_id: school_id,
            file_name: req.file.originalname,
            file_path: filePath,
            uploaded_by: uploaded_by || 'school_user',
            total_students: studentsData.length
        });

        // Insert student data with case-insensitive mapping
        const students = studentsData.map(row => {
            const findValue = (possibleKeys) => {
                const key = Object.keys(row).find(k =>
                    possibleKeys.some(pk => pk.toUpperCase() === k.toUpperCase())
                );
                return key ? row[key] : '';
            };

            return {
                upload_id: uploadId,
                school_id: school_id,
                student_name: findValue(['student_name', 'name', 'student name']),
                class: findValue(['class', 'grade', 'std']),
                roll_number: findValue(['roll_number', 'roll no', 'roll', 'rollno']),
                response_data: row
            };
        });

        await db.insertStudents(students);

        // Trigger n8n webhook for admin notification
        await triggerN8nWebhook(process.env.N8N_WEBHOOK_UPLOAD_NOTIFICATION, {
            upload_id: uploadId,
            school_id: school_id,
            school_name: school.school_name,
            file_name: req.file.originalname,
            total_students: studentsData.length,
            admin_email: process.env.ADMIN_EMAIL,
            uploaded_at: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'File uploaded successfully',
            upload_id: uploadId,
            total_students: studentsData.length,
            status: 'PENDING'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all uploads (for admin panel)
app.get('/api/uploads', async (req, res) => {
    try {
        const uploads = await db.getAllUploads();
        res.json({ success: true, uploads });
    } catch (error) {
        console.error('Get uploads error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific upload details
app.get('/api/upload/:id', async (req, res) => {
    try {
        const uploadId = req.params.id;
        const upload = await db.getUpload(uploadId);

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        const students = await db.getStudentsByUpload(uploadId);

        res.json({
            success: true,
            upload,
            students
        });
    } catch (error) {
        console.error('Get upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk delete uploads
app.post('/api/uploads/bulk-delete', async (req, res) => {
    try {
        const { upload_ids } = req.body;
        if (!upload_ids || !Array.isArray(upload_ids) || upload_ids.length === 0) {
            return res.status(400).json({ error: 'upload_ids array is required' });
        }

        console.log(`🗑️ Bulk deleting ${upload_ids.length} uploads...`);

        for (const id of upload_ids) {
            const upload = await db.getUpload(id);
            if (upload) {
                await db.deleteUpload(id);
                // Clean up files
                if (fs.existsSync(upload.file_path)) {
                    try { fs.unlinkSync(upload.file_path); } catch (e) { }
                }
                const pdfPath = path.resolve(__dirname, 'n8n_files', `report_${id}.pdf`);
                if (fs.existsSync(pdfPath)) {
                    try { fs.unlinkSync(pdfPath); } catch (e) { }
                }
            }
        }

        res.json({ success: true, message: `${upload_ids.length} uploads deleted successfully` });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete upload
app.delete('/api/upload/:id', async (req, res) => {
    try {
        const uploadId = req.params.id;

        // Get upload details to potentially delete files if needed
        const upload = await db.getUpload(uploadId);
        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        // Delete from database
        await db.deleteUpload(uploadId);

        // Optional: Clean up files
        if (fs.existsSync(upload.file_path)) {
            try {
                fs.unlinkSync(upload.file_path);
            } catch (e) {
                console.warn('Could not delete Excel file:', e.message);
            }
        }

        const pdfPath = path.resolve('C:/Users/NSF/.n8n-files', `report_${uploadId}.pdf`);
        if (fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.warn('Could not delete PDF file:', e.message);
            }
        }

        res.json({ success: true, message: 'Upload and students data deleted successfully' });
    } catch (error) {
        console.error('Delete upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve or reject upload
app.post('/api/approve-upload', async (req, res) => {
    try {
        const { upload_id, status, reviewed_by, notes } = req.body;

        if (!upload_id || !status) {
            return res.status(400).json({ error: 'upload_id and status are required' });
        }

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'status must be APPROVED or REJECTED' });
        }

        // Get upload details
        const upload = await db.getUpload(upload_id);
        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        // Update status
        await db.updateUploadStatus(upload_id, status, reviewed_by || 'admin');

        // If approved, trigger n8n workflow for report generation
        if (status === 'APPROVED') {
            const students = await db.getStudentsByUpload(upload_id);

            // Step 1: Generate the PDF internally in the backend
            // Use local directory to avoid permission issues
            const n8nDir = path.resolve(__dirname, 'n8n_files');
            if (!fs.existsSync(n8nDir)) fs.mkdirSync(n8nDir, { recursive: true });

            const pdfPath = path.resolve(n8nDir, `report_${upload_id}.pdf`);

            console.log(`🚀 Starting internal PDF generation for Upload #${upload_id}...`);
            await generatePDF(upload_id, pdfPath);
            console.log(`✅ PDF ready at ${pdfPath}`);

            // Step 2: (Skipped) No need to convert to base64, we will send the URL

            // Step 3: Notify n8n to send the email with the download URL
            await triggerN8nWebhook(process.env.N8N_WEBHOOK_APPROVAL_TRIGGER, {
                upload_id: upload_id,
                school_id: upload.school_id,
                school_name: upload.school_name,
                principal_email: upload.principal_email,
                district: upload.district,
                total_students: students.length,
                file_name: upload.file_name,
                approved_at: new Date().toISOString(),
                pdf_url: `http://localhost:3000/generated-reports/report_${upload_id}.pdf`,
                pdf_name: `Report_Card_${upload_id}.pdf`
            });
        }

        res.json({
            success: true,
            message: `Upload ${status.toLowerCase()} successfully`,
            upload_id,
            status
        });

    } catch (error) {
        console.error('Approve upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark upload as COMPLETED (called by n8n after report is sent)
app.post('/api/complete-upload', async (req, res) => {
    try {
        const { upload_id } = req.body;
        console.log('Received /api/complete-upload request:', req.body);
        if (!upload_id) {
            console.error('Missing upload_id in request body');
            return res.status(400).json({ error: 'upload_id is required' });
        }
        await db.updateUploadStatus(upload_id, 'COMPLETED', 'n8n-automation');
        res.json({ success: true, message: 'Upload status updated to COMPLETED' });
    } catch (error) {
        console.error('Complete upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get report data (minimal data for PDF generation)
app.get('/api/report-data/:id', async (req, res) => {
    try {
        const uploadId = req.params.id;
        const upload = await db.getUpload(uploadId);

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        const students = await db.getStudentsByUpload(uploadId);

        // Parse response_data JSON for each student
        const parsedStudents = students.map(s => {
            try {
                return {
                    ...s,
                    response_data: typeof s.response_data === 'string' ? JSON.parse(s.response_data) : s.response_data
                };
            } catch (e) {
                return s;
            }
        });

        res.json({
            success: true,
            school_name: upload.school_name,
            district: upload.district,
            total_students: upload.total_students,
            report_date: new Date(upload.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            students: parsedStudents
        });
    } catch (error) {
        console.error('Get report data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get schools list
app.get('/api/schools', async (req, res) => {
    try {
        const schools = await db.query('SELECT * FROM schools ORDER BY school_name');
        res.json({ success: true, schools });
    } catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('⚠️  Starting server without database connection. Please check your database configuration.');
    }

    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`\n📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💾 Database: ${process.env.DB_NAME || 'school_reports'}`);
        console.log(`📁 Upload directory: ${uploadDir}\n`);
    });
}

startServer();

module.exports = app;
