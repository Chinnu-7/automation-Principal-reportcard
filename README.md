# 📊 School Data Upload & Automated Reporting System

Complete full-stack solution for automated school data processing with NSF admin approval and automated principal report generation via n8n.

## 🎯 Features

- **School Upload Interface**: Drag-and-drop Excel file upload with real-time status tracking
- **NSF Admin Panel**: Review, approve, or reject school data submissions
- **Automated Notifications**: Instant email alerts to NSF admin on new uploads
- **Automated Reports**: Generate and email comprehensive reports to principals
- **n8n Integration**: Fully automated workflow orchestration
- **Modern UI**: Premium dark theme with glassmorphism effects

## 🏗️ System Architecture

```
School Upload → Backend API → Database
                     ↓
                  n8n Webhook → Email NSF Admin
                     ↓
            Admin Approval → n8n Webhook
                     ↓
            Generate Report → Email Principal → Update Status
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 5.7+ or **PostgreSQL** 12+
- **n8n** (self-hosted or n8n.cloud account)
- **SMTP Email** service (Gmail, Outlook, or custom)

## 🚀 Quick Start

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE school_reports;

# Import schema
mysql -u root -p school_reports < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env with your configuration
notepad .env

# Start server
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. n8n Setup

#### Option A: Using n8n Cloud
1. Sign up at [n8n.cloud](https://n8n.cloud)
2. Create a new workflow
3. Import `n8n/workflow-1-upload-notification.json`
4. Import `n8n/workflow-2-report-generation.json`
5. Configure SMTP credentials
6. Configure MySQL credentials
7. Activate both workflows
8. Copy webhook URLs and update backend `.env`

#### Option B: Self-Hosted n8n
```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start

# Access at http://localhost:5678
```

Then follow the same import steps as Option A.

## ⚙️ Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_reports

# n8n Webhooks (get these from n8n after importing workflows)
N8N_WEBHOOK_UPLOAD_NOTIFICATION=https://your-n8n.app.n8n.cloud/webhook/new-upload
N8N_WEBHOOK_APPROVAL_TRIGGER=https://your-n8n.app.n8n.cloud/webhook/upload-approved

# Admin Email
ADMIN_EMAIL=nsf.admin@example.com

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### n8n SMTP Configuration

In n8n, create SMTP credentials:
- **Host**: smtp.gmail.com (for Gmail)
- **Port**: 587
- **User**: your-email@gmail.com
- **Password**: your-app-password (not regular password!)

For Gmail, generate an app password: https://myaccount.google.com/apppasswords

### n8n Database Configuration

In n8n, create MySQL credentials:
- **Host**: localhost
- **Database**: school_reports
- **User**: root
- **Password**: your_password

## 📁 Project Structure

```
Automation of Report card/
├── backend/
│   ├── server.js           # Express server
│   ├── db.js              # Database connection
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── components/
│   │   │   ├── SchoolUpload.jsx
│   │   │   └── AdminPanel.jsx
│   │   └── index.css      # Design system
│   ├── index.html
│   └── package.json
├── database/
│   └── schema.sql         # Database schema
├── n8n/
│   ├── workflow-1-upload-notification.json
│   └── workflow-2-report-generation.json
├── templates/
│   └── student-data-template.xlsx
└── docs/
    └── API.md
```

## 🔄 Workflow

### School User Flow
1. Select school from dropdown
2. Upload Excel file with student data
3. View upload status (PENDING)
4. Wait for admin approval
5. Principal receives automated report via email

### NSF Admin Flow
1. Receive email notification of new upload
2. Login to admin panel
3. Review upload details and student data
4. Approve or reject upload
5. System automatically generates and emails report to principal

## 📧 Email Templates

### Admin Notification Email
- Sent when: New upload is submitted
- To: NSF Admin
- Contains: School details, file info, link to dashboard

### Principal Report Email
- Sent when: Upload is approved
- To: School principal
- Contains: Student statistics, class distribution, insights

## 🧪 Testing

### Test the Upload Flow

1. Start backend and frontend
2. Open `http://localhost:5173`
3. Select a school (e.g., "Green Valley High School")
4. Upload the template Excel file from `templates/`
5. Check backend console for webhook logs
6. Check admin email for notification

### Test the Approval Flow

1. Go to Admin Panel (`http://localhost:5173/admin`)
2. Click "View" on pending upload
3. Click "Approve"
4. Check n8n execution logs
5. Check principal email for report

## 🛠️ Troubleshooting

### Database Connection Failed
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### n8n Webhooks Not Working
- Check webhook URLs in `.env`
- Verify workflows are activated in n8n
- Check n8n execution logs for errors
- Ensure n8n can access the database

### Email Not Sending
- Verify SMTP credentials in n8n
- For Gmail, use app password, not regular password
- Check spam folder
- Review n8n email node logs

### File Upload Fails
- Check file size (max 10MB)
- Ensure file is .xlsx or .xls format
- Verify `uploads/` directory exists and is writable
- Check backend console for errors

## 📊 Excel Template Format

The Excel file must include these columns:
- `school_id` - School identifier (e.g., SCH001)
- `student_name` - Student's full name
- `class` - Class/Grade (e.g., "10-A")
- `roll_number` - Student roll number
- Additional columns for survey responses

See `templates/student-data-template.xlsx` for reference.

## 🔒 Security Considerations

- Use environment variables for sensitive data
- Never commit `.env` files to version control
- Use HTTPS in production
- Implement authentication for admin panel
- Validate and sanitize all file uploads
- Use prepared statements for database queries (already implemented)

## 🚀 Production Deployment

### Backend
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

### Database
- Use managed database service (AWS RDS, DigitalOcean, etc.)
- Enable SSL connections
- Regular backups

### n8n
- Use n8n.cloud for managed hosting
- Or self-host with Docker and reverse proxy
- Enable SSL/TLS

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review n8n execution logs
- Check backend console output
- Review API documentation in `docs/API.md`

## 📝 License

MIT License - Feel free to use and modify for your needs.

---

**Built with ❤️ for NSF School Reporting**
