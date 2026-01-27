const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function runTest() {
    try {
        const filePath = path.resolve('d:/Automation of Report card/templates/student-data-template.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('Test file not found:', filePath);
            return;
        }

        console.log('1. Uploading file...');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('school_id', 'SCH003'); // Use a valid school ID
        form.append('uploaded_by', 'test_user');

        const uploadRes = await axios.post('http://localhost:3000/api/upload', form, {
            headers: { ...form.getHeaders() }
        });

        if (!uploadRes.data.success) {
            console.error('Upload failed:', uploadRes.data);
            return;
        }

        const uploadId = uploadRes.data.upload_id;
        console.log(`✅ Upload Successful. ID: ${uploadId}`);

        console.log('2. Approving upload...');
        const approveRes = await axios.post('http://localhost:3000/api/approve-upload', {
            upload_id: uploadId,
            status: 'APPROVED',
            reviewed_by: 'auto_tester'
        });

        if (approveRes.data.success) {
            console.log('✅ Approval Successful.');
            console.log('Backend should now be generating the PDF...');
        } else {
            console.error('Approval failed:', approveRes.data);
        }

    } catch (error) {
        console.error('Test Error:', error.response ? error.response.data : error.message);
    }
}

runTest();
