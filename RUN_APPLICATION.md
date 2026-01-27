# 🚀 Final Steps to Run the Application

## ✅ What's Done
- All code files created
- Node.js installer downloaded (node-v24.13.0-x64.msi)
- Database schema ready
- Frontend and backend ready to run

## 📥 Step 1: Install Node.js (2 minutes)

1. **Locate the downloaded file** in your Downloads folder:
   - File name: `node-v24.13.0-x64.msi`

2. **Run the installer**:
   - Double-click the .msi file
   - Click "Next" through the wizard
   - Accept the license agreement
   - Use default installation location
   - Click "Install"
   - Click "Finish"

3. **Restart PowerShell/Terminal** (Important!)
   - Close all PowerShell/Terminal windows
   - Open a new PowerShell window

4. **Verify installation**:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers (v24.13.0 and npm 10.x.x)

## 🗄️ Step 2: Setup Database (3 minutes)

```powershell
# Open MySQL
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE school_reports;
USE school_reports;
SOURCE d:/Automation of Report card/database/schema.sql;
exit;
```

**Edit backend/.env** if you have a MySQL password:
```env
DB_PASSWORD=your_password_here
```

## ▶️ Step 3: Run the Application (2 minutes)

### Terminal 1 - Backend:
```powershell
cd "d:\Automation of Report card\backend"
npm install
npm run dev
```

Wait for: `🚀 Server running on http://localhost:3000`

### Terminal 2 - Frontend (open new terminal):
```powershell
cd "d:\Automation of Report card\frontend"
npm install
npm run dev
```

Wait for: `Local: http://localhost:5173`

## 🎉 Step 4: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health

## 🧪 Quick Test

1. Go to http://localhost:5173
2. Select "Green Valley High School"
3. Upload the file: `d:\Automation of Report card\templates\student-data-template.xlsx`
4. Click "Admin Panel" in navigation
5. View the upload and click "Approve"

✅ System working!

## 📧 Optional: Setup n8n for Email Automation

See `docs/N8N_SETUP.md` for complete instructions.

Quick version:
1. Sign up at https://n8n.cloud
2. Import workflows from `n8n/` folder
3. Configure SMTP and MySQL credentials
4. Update webhook URLs in `backend/.env`

---

## ⚠️ Troubleshooting

**"npm not found" after installation?**
- Restart your terminal/PowerShell
- Make sure you closed ALL terminal windows

**Database connection error?**
- Verify MySQL is running
- Check password in `backend/.env`
- Ensure database `school_reports` exists

**Port already in use?**
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

**Frontend can't connect to backend?**
- Ensure backend is running first
- Check backend console for errors

---

## 📞 Need Help?

Check these files:
- `README.md` - Complete documentation
- `QUICKSTART.md` - Quick start guide
- `docs/API.md` - API reference
- `docs/N8N_SETUP.md` - n8n setup

---

**Once Node.js is installed, just run the commands in Step 3 and you're live! 🚀**
