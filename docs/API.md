# API Documentation

Base URL: `http://localhost:3000/api`

## Endpoints

### 1. Health Check

**GET** `/api/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### 2. Get All Schools

**GET** `/api/schools`

Retrieve list of all schools.

**Response:**
```json
{
  "success": true,
  "schools": [
    {
      "school_id": "SCH001",
      "school_name": "Green Valley High School",
      "principal_email": "principal@greenvalley.edu",
      "district": "North District",
      "address": "123 Education Lane",
      "phone": "+91-9876543210"
    }
  ]
}
```

---

### 3. Upload Excel File

**POST** `/api/upload`

Upload student data Excel file.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (file): Excel file (.xlsx or .xls)
  - `school_id` (string): School identifier
  - `uploaded_by` (string, optional): Uploader name

**Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('school_id', 'SCH001');
formData.append('uploaded_by', 'school_user');

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

**Success Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "upload_id": 123,
  "total_students": 45,
  "status": "PENDING"
}
```

**Error Response:**
```json
{
  "error": "School not found"
}
```

**Triggers:**
- n8n webhook for admin notification

---

### 4. Get All Uploads

**GET** `/api/uploads`

Retrieve all uploads with school information.

**Response:**
```json
{
  "success": true,
  "uploads": [
    {
      "upload_id": 123,
      "school_id": "SCH001",
      "school_name": "Green Valley High School",
      "principal_email": "principal@greenvalley.edu",
      "file_name": "students_data.xlsx",
      "file_path": "./uploads/1234567890-students_data.xlsx",
      "status": "PENDING",
      "uploaded_by": "school_user",
      "uploaded_at": "2026-01-23T14:30:00.000Z",
      "reviewed_by": null,
      "reviewed_at": null,
      "total_students": 45,
      "notes": null
    }
  ]
}
```

---

### 5. Get Upload Details

**GET** `/api/upload/:id`

Get specific upload with student data.

**Parameters:**
- `id` (path): Upload ID

**Response:**
```json
{
  "success": true,
  "upload": {
    "upload_id": 123,
    "school_id": "SCH001",
    "school_name": "Green Valley High School",
    "principal_email": "principal@greenvalley.edu",
    "district": "North District",
    "file_name": "students_data.xlsx",
    "status": "PENDING",
    "total_students": 45,
    "uploaded_at": "2026-01-23T14:30:00.000Z"
  },
  "students": [
    {
      "student_id": 1,
      "upload_id": 123,
      "school_id": "SCH001",
      "student_name": "John Doe",
      "class": "10-A",
      "roll_number": "101",
      "response_data": "{\"question1\":\"answer1\"}",
      "created_at": "2026-01-23T14:30:00.000Z"
    }
  ]
}
```

---

### 6. Approve or Reject Upload

**POST** `/api/approve-upload`

Approve or reject a pending upload.

**Request Body:**
```json
{
  "upload_id": 123,
  "status": "APPROVED",
  "reviewed_by": "NSF Admin",
  "notes": "Optional notes"
}
```

**Fields:**
- `upload_id` (number, required): Upload ID
- `status` (string, required): "APPROVED" or "REJECTED"
- `reviewed_by` (string, optional): Reviewer name
- `notes` (string, optional): Review notes

**Success Response:**
```json
{
  "success": true,
  "message": "Upload approved successfully",
  "upload_id": 123,
  "status": "APPROVED"
}
```

**Error Response:**
```json
{
  "error": "Upload not found"
}
```

**Triggers:**
- If APPROVED: n8n webhook for report generation and principal email

---

## Status Values

Uploads can have the following statuses:

- **PENDING**: Awaiting admin review
- **APPROVED**: Approved by admin, report generation triggered
- **REJECTED**: Rejected by admin
- **COMPLETED**: Report generated and sent to principal

## Error Codes

- **400**: Bad Request - Invalid input
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server-side error

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

## Authentication

Currently no authentication implemented. **IMPORTANT**: Add authentication before production deployment!

Recommended:
- JWT tokens for API authentication
- Role-based access control (School vs Admin)
- Session management

## CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (development frontend)

Update `FRONTEND_URL` in `.env` for production.

## File Upload Limits

- **Max file size**: 10MB (configurable via `MAX_FILE_SIZE` in `.env`)
- **Allowed formats**: .xlsx, .xls
- **Upload directory**: `./uploads` (configurable via `UPLOAD_DIR`)

## Database Schema

See `database/schema.sql` for complete schema.

### Key Tables

**schools**
- school_id (PK)
- school_name
- principal_email
- district

**uploads**
- upload_id (PK)
- school_id (FK)
- file_name
- status
- total_students

**students**
- student_id (PK)
- upload_id (FK)
- school_id (FK)
- student_name
- class
- response_data (JSON)

## Webhook Integration

### Upload Notification Webhook

**Triggered by**: `/api/upload`

**Payload:**
```json
{
  "upload_id": 123,
  "school_id": "SCH001",
  "school_name": "Green Valley High School",
  "file_name": "students_data.xlsx",
  "total_students": 45,
  "admin_email": "nsf.admin@example.com",
  "uploaded_at": "2026-01-23T14:30:00.000Z"
}
```

### Approval Webhook

**Triggered by**: `/api/approve-upload` (when status is APPROVED)

**Payload:**
```json
{
  "upload_id": 123,
  "school_id": "SCH001",
  "school_name": "Green Valley High School",
  "principal_email": "principal@greenvalley.edu",
  "district": "North District",
  "total_students": 45,
  "file_name": "students_data.xlsx",
  "approved_at": "2026-01-23T15:00:00.000Z",
  "students_data": [...]
}
```

## Example Usage

### JavaScript/Fetch

```javascript
// Upload file
const uploadFile = async (file, schoolId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('school_id', schoolId);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Approve upload
const approveUpload = async (uploadId) => {
  const response = await fetch('/api/approve-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      upload_id: uploadId,
      status: 'APPROVED',
      reviewed_by: 'Admin Name'
    })
  });
  
  return await response.json();
};
```

### cURL

```bash
# Get all schools
curl http://localhost:3000/api/schools

# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@students.xlsx" \
  -F "school_id=SCH001"

# Approve upload
curl -X POST http://localhost:3000/api/approve-upload \
  -H "Content-Type: application/json" \
  -d '{"upload_id": 123, "status": "APPROVED", "reviewed_by": "Admin"}'
```

---

**Last Updated**: January 2026
