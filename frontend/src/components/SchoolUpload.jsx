import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const API_URL = '/api';

function SchoolUpload() {
    const [schools, setSchools] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [message, setMessage] = useState(null);
    const [myUploads, setMyUploads] = useState([]);

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            // Fetch directly from Supabase
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('school_name');

            if (error) throw error;
            setSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
            // Fallback to local API if needed, or just show empty
        }
    };

    const seedDummyData = async () => {
        const dummySchools = [
            { school_id: 'SCH001', school_name: 'Green Valley High School', principal_email: 'principal@greenvalley.edu', district: 'North District' },
            { school_id: 'SCH002', school_name: 'Sunrise Academy', principal_email: 'principal@sunriseacademy.edu', district: 'South District' },
            { school_id: 'SCH003', school_name: 'Bright Future School', principal_email: 'principal@brightfuture.edu', district: 'East District' },
            { school_id: 'SCH004', school_name: 'Riverdale International', principal_email: 'contact@riverdale.edu', district: 'West District' },
            { school_id: 'SCH005', school_name: 'St. Marys Convent', principal_email: 'info@stmarys.edu', district: 'Central District' }
        ];

        try {
            setUploading(true);
            const { error } = await supabase.from('schools').upsert(dummySchools);
            if (error) throw error;

            setMessage({ type: 'success', text: '✅ Dummy school data added successfully!' });
            fetchSchools();
        } catch (error) {
            console.error('Error seeding data:', error);
            setMessage({ type: 'error', text: 'Failed to add dummy data: ' + error.message });
        } finally {
            setUploading(false);
        }
    };

    const fetchMyUploads = async (schoolId) => {
        try {
            const response = await axios.get(`${API_URL}/uploads`);
            const filtered = response.data.uploads.filter(u => u.school_id === schoolId);
            setMyUploads(filtered);
        } catch (error) {
            console.error('Error fetching uploads:', error);
        }
    };

    const handleSchoolChange = (e) => {
        const schoolId = e.target.value;
        setSelectedSchool(schoolId);
        if (schoolId) {
            fetchMyUploads(schoolId);
        } else {
            setMyUploads([]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Please upload only Excel files (.xlsx or .xls)' });
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedSchool) {
            setMessage({ type: 'error', text: 'Please select a school first' });
            return;
        }

        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file to upload' });
            return;
        }

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('school_id', selectedSchool);
        formData.append('uploaded_by', 'school_user');

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({
                type: 'success',
                text: `✅ File uploaded successfully! ${response.data.total_students} students processed. Status: ${response.data.status}`
            });

            setFile(null);
            fetchMyUploads(selectedSchool);

            // Reset file input
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Upload failed. Please try again.'
            });
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'PENDING': 'badge-pending',
            'APPROVED': 'badge-approved',
            'REJECTED': 'badge-rejected',
            'COMPLETED': 'badge-completed'
        };
        return badges[status] || 'badge-pending';
    };

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">📤 Upload Student Data</h1>
                    <p>Upload your school's student response data in Excel format</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="school-select">Select Your School *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                            id="school-select"
                            value={selectedSchool}
                            onChange={handleSchoolChange}
                            disabled={uploading}
                            style={{ flex: 1 }}
                        >
                            <option value="">-- Choose School --</option>
                            {schools.map(school => (
                                <option key={school.school_id} value={school.school_id}>
                                    {school.school_name}
                                </option>
                            ))}
                        </select>
                        {schools.length === 0 && (
                            <button
                                className="btn btn-secondary"
                                onClick={seedDummyData}
                                disabled={uploading}
                                title="Click to add sample schools"
                            >
                                Seed Dummy Data
                            </button>
                        )}
                    </div>
                </div>

                <div
                    className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                    <h3>Drag & Drop Excel File Here</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        or click to browse
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Supported formats: .xlsx, .xls (Max 10MB)
                    </p>
                    <input
                        id="file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </div>

                {file && (
                    <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                        📄 Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || !file || !selectedSchool}
                    style={{ marginTop: '1rem', width: '100%' }}
                >
                    {uploading ? (
                        <>
                            <span className="spinner"></span>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <span>⬆️</span>
                            Upload File
                        </>
                    )}
                </button>
            </div>

            {myUploads.length > 0 && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">📋 My Upload History</h2>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Upload ID</th>
                                    <th>File Name</th>
                                    <th>Students</th>
                                    <th>Status</th>
                                    <th>Uploaded At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myUploads.map(upload => (
                                    <tr key={upload.upload_id}>
                                        <td>#{upload.upload_id}</td>
                                        <td>{upload.file_name}</td>
                                        <td>{upload.total_students}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(upload.status)}`}>
                                                {upload.status}
                                            </span>
                                        </td>
                                        <td>{new Date(upload.uploaded_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginTop: '2rem', background: 'rgba(59, 130, 246, 0.1)' }}>
                <h3>ℹ️ Instructions</h3>
                <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                    <li>Select your school from the dropdown</li>
                    <li>Upload Excel file with student response data</li>
                    <li>Ensure the file includes: school_id, student_name, class, and response columns</li>
                    <li>Wait for NSF Admin approval</li>
                    <li>Principal will receive automated report via email once approved</li>
                </ol>
            </div>
        </div>
    );
}

export default SchoolUpload;
