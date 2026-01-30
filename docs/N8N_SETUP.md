# n8n Workflow Setup Guide

This guide will help you set up the n8n workflows for automated notifications and report generation.

## Prerequisites

- n8n installed (cloud or self-hosted)
- SMTP email account configured
- MySQL database access
- Backend API running

## Option 1: n8n Cloud (Recommended)

### Step 1: Sign Up
1. Go to [n8n.cloud](https://n8n.cloud)
2. Create an account
3. Create a new workspace

### Step 2: Import Workflows

#### Workflow 1: Upload Notification
1. Click "Add Workflow" → "Import from File"
2. Select `n8n/workflow-1-upload-notification.json`
3. Workflow will be imported with all nodes

#### Workflow 2: Report Generation
1. Click "Add Workflow" → "Import from File"
2. Select `n8n/workflow-2-report-generation.json`
3. Workflow will be imported with all nodes

### Step 3: Configure Credentials

#### SMTP Credentials (for both workflows)
1. Click on any "Email" node
2. Click "Create New Credential"
3. Fill in details:
   - **Name**: SMTP Account
   - **Host**: smtp.gmail.com (for Gmail)
   - **Port**: 587
   - **Secure**: No (for TLS)
   - **User**: your-email@gmail.com
   - **Password**: your-app-password

**For Gmail:**
- Go to https://myaccount.google.com/apppasswords
- Generate an app password
- Use that instead of your regular password

#### MySQL Credentials (for Workflow 2)
1. Click on "Update Status to COMPLETED" node
2. Click "Create New Credential"
3. Fill in details:
   - **Name**: MySQL Database
   - **Host**: your-database-host
   - **Database**: school_reports
   - **User**: your-db-user
   - **Password**: your-db-password
   - **Port**: 3306

### Step 4: Get Webhook URLs

#### Workflow 1: Upload Notification
1. Open the workflow
2. Click on "Webhook - New Upload" node
3. Copy the "Production URL"
4. Example: `https://your-instance.app.n8n.cloud/webhook/new-upload`

#### Workflow 2: Report Generation
1. Open the workflow
2. Click on "Webhook - Upload Approved" node
3. Copy the "Production URL"
4. Example: `https://your-instance.app.n8n.cloud/webhook/upload-approved`

### Step 5: Update Backend Configuration

Edit `backend/.env`:

```env
N8N_WEBHOOK_UPLOAD_NOTIFICATION=https://your-instance.app.n8n.cloud/webhook/new-upload
N8N_WEBHOOK_APPROVAL_TRIGGER=https://your-instance.app.n8n.cloud/webhook/upload-approved
```

### Step 6: Activate Workflows

1. Open each workflow
2. Toggle the "Active" switch in the top right
3. Verify status shows "Active"

## Option 2: Self-Hosted n8n

### Step 1: Install n8n

```bash
# Install globally
npm install -g n8n

# Or use Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Step 2: Start n8n

```bash
n8n start
```

Access at: `http://localhost:5678`

### Step 3: Import and Configure

Follow the same steps as Option 1 (Steps 2-6), but webhook URLs will be:
- `http://localhost:5678/webhook/new-upload`
- `http://localhost:5678/webhook/upload-approved`

**Note**: For production, use a reverse proxy (nginx) with SSL.

## Workflow Details

### Workflow 1: Upload Notification

**Trigger**: Webhook from `/api/upload`

**Flow**:
1. Receive webhook data
2. Format data (extract fields)
3. Send email to NSF admin
4. Respond to webhook

**Email Template**: Professional HTML email with:
- Upload details
- School information
- Link to admin dashboard
- Styled with gradients and cards

### Workflow 2: Report Generation

**Trigger**: Webhook from `/api/approve-upload`

**Flow**:
1. Receive approval webhook
2. Extract data
3. Generate report (JavaScript code)
4. Send email to principal
5. Update database status to COMPLETED
6. Respond to webhook

**Report Generation**: JavaScript node calculates:
- Total students
- Class distribution
- Statistics and insights

**Email Template**: Beautiful HTML report with:
- School statistics
- Student counts
- Class breakdown
- Professional styling

## Testing Workflows

### Test Workflow 1

```bash
# Send test webhook
curl -X POST http://localhost:5678/webhook-test/new-upload \
  -H "Content-Type: application/json" \
  -d '{
    "upload_id": 1,
    "school_id": "SCH001",
    "school_name": "Test School",
    "file_name": "test.xlsx",
    "total_students": 10,
    "admin_email": "admin@example.com",
    "uploaded_at": "2026-01-23T10:00:00Z"
  }'
```

Check your admin email for the notification.

### Test Workflow 2

```bash
# Send test webhook
curl -X POST http://localhost:5678/webhook-test/upload-approved \
  -H "Content-Type: application/json" \
  -d '{
    "upload_id": 1,
    "school_id": "SCH001",
    "school_name": "Test School",
    "principal_email": "principal@example.com",
    "district": "Test District",
    "total_students": 10,
    "file_name": "test.xlsx",
    "approved_at": "2026-01-23T10:00:00Z",
    "students_data": []
  }'
```

Check principal email for the report.

## Customizing Email Templates

### Edit Email Content

1. Open workflow in n8n
2. Click on "Email" node
3. Edit the "Message" field (HTML)
4. Use n8n expressions: `{{ $json.field_name }}`
5. Save and test

### Email Styling Tips

- Use inline CSS (email clients don't support `<style>` tags well)
- Test with multiple email clients
- Keep design simple and responsive
- Use tables for layout (better email client support)

## Customizing Report Logic

### Edit Report Generation

1. Open Workflow 2
2. Click "Generate Report" node (Code node)
3. Edit JavaScript code
4. Available data: `$input.item.json.body.students_data`
5. Return object with report data

**Example**: Add average score calculation

```javascript
const students = $input.item.json.body.students_data || [];
const scores = students.map(s => {
  const data = JSON.parse(s.response_data);
  return data.score || 0;
});
const avgScore = scores.reduce((a,b) => a+b, 0) / scores.length;

return {
  json: {
    ...existingData,
    average_score: avgScore.toFixed(2)
  }
};
```

## Troubleshooting

### Webhook Not Triggering

**Check**:
1. Workflow is Active
2. Webhook URL is correct in backend `.env`
3. Backend can reach n8n (firewall/network)
4. Check n8n execution logs

**Solution**:
- Click "Listening for test event" in webhook node
- Trigger from backend
- Verify webhook receives data

### Email Not Sending

**Check**:
1. SMTP credentials are correct
2. App password is used (not regular password)
3. Email node configuration
4. Check spam folder

**Solution**:
- Test SMTP credentials separately
- Check n8n execution logs for errors
- Try different SMTP provider

### Database Update Fails

**Check**:
1. MySQL credentials are correct
2. Database is accessible from n8n
3. Table exists
4. SQL query syntax

**Solution**:
- Test database connection in n8n
- Check database logs
- Verify table schema matches query

### Report Data Missing

**Check**:
1. Students data is passed in webhook
2. JavaScript code handles empty data
3. JSON parsing works correctly

**Solution**:
- Add console.log in Code node
- Check execution data in n8n
- Handle edge cases (empty arrays, null values)

## Production Checklist

- [ ] Use n8n.cloud or secure self-hosted instance
- [ ] Enable SSL/HTTPS for webhooks
- [ ] Use environment variables for sensitive data
- [ ] Set up error notifications
- [ ] Monitor workflow executions
- [ ] Set up backup/restore for workflows
- [ ] Test email deliverability
- [ ] Configure retry logic for failed executions
- [ ] Set up logging and monitoring
- [ ] Document custom modifications

## Advanced Configuration

### Error Handling

Add error handling nodes:
1. Add "Error Trigger" node
2. Connect to notification node
3. Send alert on workflow failure

### Retry Logic

Configure in workflow settings:
- Max retries: 3
- Retry interval: 5 minutes

### Scheduling

Add scheduled triggers:
- Daily summary reports
- Weekly statistics
- Monthly analytics

### Webhooks Security

Add authentication:
1. Use webhook authentication in n8n
2. Add API key validation
3. Verify request signatures

## Support

For n8n-specific issues:
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Forum](https://community.n8n.io)
- [n8n GitHub](https://github.com/n8n-io/n8n)

---

**Happy Automating! 🚀**
