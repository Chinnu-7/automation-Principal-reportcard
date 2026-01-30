const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let dbInstance = null;

// Initialize database
async function initDatabase() {
    try {
        const dbPath = path.resolve(__dirname, 'database.sqlite');
        dbInstance = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('✅ SQLite Database connected successfully');

        // Create tables if they don't exist
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS schools (
                school_id TEXT PRIMARY KEY,
                school_name TEXT NOT NULL,
                principal_email TEXT NOT NULL,
                district TEXT,
                address TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS uploads (
                upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
                school_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                uploaded_by TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_by TEXT,
                reviewed_at DATETIME,
                total_students INTEGER DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS students (
                student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                upload_id INTEGER NOT NULL,
                school_id TEXT NOT NULL,
                student_name TEXT,
                class TEXT,
                roll_number TEXT,
                response_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (upload_id) REFERENCES uploads(upload_id) ON DELETE CASCADE,
                FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE
            );
        `);

        // Seed sample data if schools table is empty
        const schoolsCount = await dbInstance.get('SELECT COUNT(*) as count FROM schools');
        if (schoolsCount.count === 0) {
            await dbInstance.exec(`
                INSERT INTO schools (school_id, school_name, principal_email, district, address, phone) VALUES
                ('SCH001', 'Green Valley High School', 'principal@greenvalley.edu', 'North District', '123 Education Lane', '+91-9876543210'),
                ('SCH002', 'Sunrise Academy', 'jyothsnaangadi7@gmail.com', 'South District', '456 Learning Street', '+91-9876543211'),
                ('SCH003', 'Bright Future School', 'pradeep.gadwal94@gmail.com', 'East District', '789 Knowledge Road', '+91-9876543212');
            `);
            console.log('🌱 Sample schools data seeded');
        }

        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}

// Database helper functions
const db = {
    // Execute query
    async query(sql, params = []) {
        if (!dbInstance) await initDatabase();

        // Normalize params to array if it's not
        if (params === undefined) params = [];

        try {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return await dbInstance.all(sql, params);
            } else {
                const result = await dbInstance.run(sql, params);
                // Return result object that mimics mysql2 result format where needed
                return {
                    insertId: result.lastID,
                    affectedRows: result.changes,
                    lastID: result.lastID,
                    changes: result.changes
                };
            }
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },

    // Get school by ID
    async getSchool(schoolId) {
        const sql = 'SELECT * FROM schools WHERE school_id = ?';
        const rows = await this.query(sql, [schoolId]);
        return rows[0];
    },

    // Create upload record
    async createUpload(data) {
        const sql = `
            INSERT INTO uploads (school_id, file_name, file_path, uploaded_by, total_students, status)
            VALUES (?, ?, ?, ?, ?, 'PENDING')
        `;
        const result = await this.query(sql, [
            data.school_id,
            data.file_name,
            data.file_path,
            data.uploaded_by || 'system',
            data.total_students || 0
        ]);
        return result.insertId;
    },

    // Insert student data
    async insertStudents(students) {
        if (!students || students.length === 0) return;

        const sql = `
            INSERT INTO students (upload_id, school_id, student_name, class, roll_number, response_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const student of students) {
            await this.query(sql, [
                student.upload_id,
                student.school_id,
                student.student_name,
                student.class,
                student.roll_number,
                JSON.stringify(student.response_data)
            ]);
        }
    },

    // Get all uploads
    async getAllUploads() {
        const sql = `
            SELECT u.*, s.school_name, s.principal_email
            FROM uploads u
            LEFT JOIN schools s ON u.school_id = s.school_id
            ORDER BY u.uploaded_at DESC
        `;
        return await this.query(sql);
    },

    // Get upload by ID
    async getUpload(uploadId) {
        const sql = `
            SELECT u.*, s.school_name, s.principal_email, s.district
            FROM uploads u
            LEFT JOIN schools s ON u.school_id = s.school_id
            WHERE u.upload_id = ?
        `;
        const rows = await this.query(sql, [uploadId]);
        return rows[0];
    },

    // Update upload status
    async updateUploadStatus(uploadId, status, reviewedBy) {
        const sql = `
            UPDATE uploads 
            SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE upload_id = ?
        `;
        return await this.query(sql, [status, reviewedBy, uploadId]);
    },

    // Get students by upload ID
    async getStudentsByUpload(uploadId) {
        const sql = 'SELECT * FROM students WHERE upload_id = ?';
        return await this.query(sql, [uploadId]);
    },

    // Get students by school ID
    async getStudentsBySchool(schoolId) {
        const sql = 'SELECT * FROM students WHERE school_id = ? ORDER BY created_at DESC';
        return await this.query(sql, [schoolId]);
    },

    // Delete upload record (students will be deleted by ON DELETE CASCADE)
    async deleteUpload(uploadId) {
        const sql = 'DELETE FROM uploads WHERE upload_id = ?';
        return await this.query(sql, [uploadId]);
    }
};

module.exports = { db, testConnection: initDatabase };
