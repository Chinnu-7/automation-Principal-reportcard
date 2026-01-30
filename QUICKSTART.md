# Quick Start Guide

Get your School Data Upload & Reporting System running in 15 minutes!

## Step 1: Database Setup (3 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
CREATE DATABASE school_reports;
USE school_reports;
SOURCE d:/Automation of Report card/database/schema.sql;
```

✅ Database ready with sample schools!

## Step 2: Backend Setup (5 minutes)

```bash
cd "d:/Automation of Report card/backend"

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env - Update these values:
# DB_PASSWORD=your_mysql_password
# ADMIN_EMAIL=your_email@example.com
notepad .env

# Start backend
npm run dev
```

✅ Backend running at http://localhost:3000

## Step 3: Frontend Setup (3 minutes)

```bash
# Open new terminal
cd "d:/Automation of Report card/frontend"

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at http://localhost:5173

## Step 4: Test Without n8n (2 minutes)

1. Open http://localhost:5173
2. Select "Green Valley High School"
3. Upload `templates/student-data-template.xlsx`
4. Go to Admin Panel: http://localhost:5173/admin
5. View and approve the upload

**Note**: Email notifications won't work yet (need n8n), but the core system works!

## Step 5: Setup n8n (Optional - 10 minutes)

### Quick Option: n8n Cloud

1. Sign up at https://n8n.cloud (free trial)
2. Import workflows:
   - `n8n/workflow-1-upload-notification.json`
   - `n8n/workflow-2-report-generation.json`
3. Configure SMTP credentials (Gmail app password)
4. Configure MySQL credentials
5. Copy webhook URLs
6. Update `backend/.env` with webhook URLs
7. Activate workflows

✅ Full automation ready!

## What You Built

✨ **School Upload Interface**
- Drag-and-drop Excel upload
- Real-time status tracking
- Upload history

✨ **Admin Panel**
- Review submissions
- Approve/reject uploads
- View student data

✨ **Automated Workflows** (with n8n)
- Email notifications to admin
- Automated report generation
- Email reports to principals

## Next Steps

1. **Customize**: Edit email templates in n8n workflows
2. **Add Schools**: Insert more schools in database
3. **Deploy**: Follow production deployment guide in README.md
4. **Secure**: Add authentication (see docs)

## Troubleshooting

**Backend won't start?**
- Check MySQL is running
- Verify database credentials in `.env`

**Frontend shows errors?**
- Ensure backend is running first
- Check browser console for errors

**Can't upload files?**
- Check file is .xlsx or .xls
- Verify school is selected
- Max file size is 10MB

## File Locations

- **Backend**: `d:/Automation of Report card/backend/`
- **Frontend**: `d:/Automation of Report card/frontend/`
- **Database**: `d:/Automation of Report card/database/`
- **n8n Workflows**: `d:/Automation of Report card/n8n/`
- **Docs**: `d:/Automation of Report card/docs/`

## Need Help?

- 📖 Full documentation: `README.md`
- 🔌 API docs: `docs/API.md`
- 🤖 n8n setup: `docs/N8N_SETUP.md`

---

**You're all set! 🎉**
