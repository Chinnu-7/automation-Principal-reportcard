# Software Requirements Specification (SRS)
## Project: Automation of Report Card System

### 1. Introduction
#### 1.1 Purpose
The purpose of this document is to provide a detailed overview of the software requirements for the **Automation of Report Card System**. It describes the functional and non-functional requirements, system architecture, and technical specifications for the automated processing of student data and report delivery.

#### 1.2 Scope
The system is designed to streamline the assessment reporting process for the NorthSouth Foundation (NSF). It enables schools to upload student performance data, allows NSF admins to review and approve these uploads, and automatically generates and emails comprehensive PDF report cards to school principals.

---

### 2. User Roles and Responsibilities
| Role | Responsibility |
| :--- | :--- |
| **School Administrator** | Selects school, uploads student data Excel files, and monitors upload status. |
| **NSF Admin** | Reviews uploaded data, performs validation, and approves/rejects submissions. |
| **Principal** | Receives the finalized "Whole Report Card" as an encrypted/protected PDF via email. |
| **System Automation** | Handles PDF generation, database updates, and email orchestration via n8n. |

---

### 3. Functional Requirements
#### 3.1 School Selection & Data Upload
- The system shall provide a dropdown menu for selecting pre-registered schools.
- The system shall support drag-and-drop file uploads for Excel format (.xlsx, .xls).
- The system shall validate file format and size (Max 10MB).
- The system shall parse Excel data and store it in a relational database.

#### 3.2 Admin Dashboard
- The system shall display all pending, approved, and rejected uploads.
- The system shall allow admins to view detailed student data for any specific upload.
- The system shall provide "Approve" and "Reject" actions for each pending submission.

#### 3.3 PDF Report Generation
- Upon approval, the system shall automatically generate a comprehensive PDF report card.
- The report shall include:
    - A summary page with subject averages and school-level statistics.
    - Individual student detail pages with specific performance metrics.
- The system shall use Puppeteer to render the report from a dynamic HTML template (`report.html`).

#### 3.4 Automated Workflow (n8n & Gmail API)
- The system shall trigger an n8n webhook upon every new upload to notify the NSF Admin.
- The system shall trigger an n8n webhook upon approval to initiate report generation.
- The system shall send the final report as an attachment to the principal.
- The system shall use the **Gmail API (OAuth2)** for email delivery to ensure reliability and bypass SMTP port restrictions.
- The system shall implement "Retry on Fail" logic (3 attempts) for critical nodes.

---

### 4. Technical Stack
| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Vanilla CSS (Glassmorphism design) |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite3 (Local) / MySQL (Production) |
| **Orchestration** | n8n |
| **PDF Engine** | Puppeteer (Headless Chrome) |
| **Email Interface** | Gmail API (OAuth2) |

---

### 5. Data Requirements
#### 5.1 Database Schema
- **Schools**: `school_id`, `school_name`, `principal_email`, `district`.
- **Uploads**: `upload_id`, `school_id`, `status` (PENDING/APPROVED/REJECTED/COMPLETED), `file_path`.
- **Students**: `student_id`, `upload_id`, `student_name`, `class`, `roll_number`, `response_data` (JSON).

#### 5.2 Formulas & Calculations
The system calculates the following metrics for the Summary Page:
- **Subject Average**: $\text{Avg} = \frac{\sum(\text{Marks obtained for Subject})}{\text{Total number of students}}$
- **Grade Logic**:
    - **A+**: $\ge 90\%$
    - **A**: $80\% - 89\%$
    - **B+**: $70\% - 79\%$
    - **B**: $60\% - 69\%$
    - **C**: $50\% - 59\%$
    - **D**: $< 50\%$

---

### 6. Non-Functional Requirements
- **Security**: Admin panel access and data uploads must be protected. Gmail API integration uses OAuth2 for secure authorization.
- **Reliability**: Workflows include error handling and automatic retry mechanisms.
- **Performance**: PDF generation must complete within 60 seconds; n8n webhook timeout is set to 15 seconds.
- **Maintainability**: Modular script structure for PDF generation and template-based HTML reports.

---

### 7. External Interface Requirements
- **Hardware**: Standard x64 server (Local or Cloud).
- **Software**: Browser (Chrome/Edge/Firefox), Node.js environment.
- **Communication**: HTTPS for API requests, Webhooks for n8n integration.
