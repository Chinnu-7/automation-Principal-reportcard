import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

function AdminPanel() {
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUpload, setSelectedUpload] = useState(null);
    const [students, setStudents] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchUploads();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchUploads, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchUploads = async () => {
        try {
            const response = await axios.get(`${API_URL}/uploads`);
            setUploads(response.data.uploads || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching uploads:', error);
            setLoading(false);
        }
    };

    const viewUploadDetails = async (uploadId) => {
        try {
            const response = await axios.get(`${API_URL}/upload/${uploadId}`);
            setSelectedUpload(response.data.upload);
            setStudents(response.data.students || []);
        } catch (error) {
            console.error('Error fetching upload details:', error);
            setMessage({ type: 'error', text: 'Failed to load upload details' });
        }
    };

    const handleApproval = async (uploadId, status) => {
        if (!confirm(`Are you sure you want to ${status} this upload?`)) {
            return;
        }

        setProcessing(true);
        setMessage(null);

        try {
            await axios.post(`${API_URL}/approve-upload`, {
                upload_id: uploadId,
                status: status,
                reviewed_by: 'NSF Admin'
            });

            setMessage({
                type: 'success',
                text: `✅ Upload ${status.toLowerCase()} successfully! ${status === 'APPROVED' ? 'Report generation triggered.' : ''}`
            });

            fetchUploads();
            setSelectedUpload(null);
            setStudents([]);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Action failed. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (uploadId) => {
        if (!confirm(`⚠️ WARNING: This will permanently delete upload #${uploadId} and all associated student data. This action cannot be undone. \n\nAre you sure you want to proceed?`)) {
            return;
        }

        setProcessing(true);
        setMessage(null);

        try {
            await axios.delete(`${API_URL}/upload/${uploadId}`);

            setMessage({
                type: 'success',
                text: `🗑️ Upload #${uploadId} and all associated data deleted successfully.`
            });

            fetchUploads();
            if (selectedUpload?.upload_id === uploadId) {
                setSelectedUpload(null);
                setStudents([]);
            }

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Delete failed. Please try again.'
            });
        } finally {
            setProcessing(false);
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

    const getStatusIcon = (status) => {
        const icons = {
            'PENDING': '⏳',
            'APPROVED': '✅',
            'REJECTED': '❌',
            'COMPLETED': '🎉'
        };
        return icons[status] || '📄';
    };

    const filteredUploads = uploads.filter(upload => {
        if (filter === 'ALL') return true;
        return upload.status === filter;
    });

    const stats = {
        total: uploads.length,
        pending: uploads.filter(u => u.status === 'PENDING').length,
        approved: uploads.filter(u => u.status === 'APPROVED').length,
        completed: uploads.filter(u => u.status === 'COMPLETED').length
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredUploads.map(u => u.upload_id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (uploadId) => {
        setSelectedIds(prev =>
            prev.includes(uploadId)
                ? prev.filter(id => id !== uploadId)
                : [...prev, uploadId]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`⚠️ WARNING: This will permanently delete ${selectedIds.length} selected uploads and all associated student data. \n\nAre you sure you want to proceed?`)) {
            return;
        }

        setProcessing(true);
        setMessage(null);

        try {
            await axios.post(`${API_URL}/uploads/bulk-delete`, {
                upload_ids: selectedIds
            });

            setMessage({
                type: 'success',
                text: `🗑️ ${selectedIds.length} uploads deleted successfully.`
            });

            setSelectedIds([]);
            fetchUploads();

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Bulk delete failed. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem' }}>Loading uploads...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">🛡️ NSF Admin Panel</h1>
                    <p>Review and approve school data uploads</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats.total}</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Uploads</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem', borderColor: 'var(--warning)' }}>
                        <div style={{ fontSize: '2rem' }}>⏳</div>
                        <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--warning)' }}>{stats.pending}</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pending</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem', borderColor: 'var(--success)' }}>
                        <div style={{ fontSize: '2rem' }}>✅</div>
                        <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--success)' }}>{stats.approved}</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Approved</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem', borderColor: 'var(--info)' }}>
                        <div style={{ fontSize: '2rem' }}>🎉</div>
                        <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: 'var(--info)' }}>{stats.completed}</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Completed</p>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All ({uploads.length})
                    </button>
                    <button
                        className={`btn ${filter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('PENDING')}
                    >
                        ⏳ Pending ({stats.pending})
                    </button>
                    <button
                        className={`btn ${filter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('APPROVED')}
                    >
                        ✅ Approved ({stats.approved})
                    </button>
                    <button
                        className={`btn ${filter === 'COMPLETED' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('COMPLETED')}
                    >
                        🎉 Completed ({stats.completed})
                    </button>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--danger)'
                    }}>
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                            {selectedIds.length} items selected
                        </span>
                        <button
                            className="btn btn-danger"
                            onClick={handleBulkDelete}
                            disabled={processing}
                        >
                            🗑️ Delete Selected
                        </button>
                    </div>
                )}

                {/* Uploads Table */}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === filteredUploads.length && filteredUploads.length > 0}
                                    />
                                </th>
                                <th>ID</th>
                                <th>School</th>
                                <th>File Name</th>
                                <th>Students</th>
                                <th>Status</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUploads.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No uploads found
                                    </td>
                                </tr>
                            ) : (
                                filteredUploads.map(upload => (
                                    <tr key={upload.upload_id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(upload.upload_id)}
                                                onChange={() => handleSelectOne(upload.upload_id)}
                                            />
                                        </td>
                                        <td>#{upload.upload_id}</td>
                                        <td>
                                            <strong>{upload.school_name}</strong>
                                            <br />
                                            <small style={{ color: 'var(--text-muted)' }}>{upload.school_id}</small>
                                        </td>
                                        <td>{upload.file_name}</td>
                                        <td>{upload.total_students}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(upload.status)}`}>
                                                {getStatusIcon(upload.status)} {upload.status}
                                            </span>
                                        </td>
                                        <td>{new Date(upload.uploaded_at).toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => viewUploadDetails(upload.upload_id)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                >
                                                    👁️ View Details
                                                </button>
                                                <a
                                                    href={`/report-card/index.html?id=${upload.upload_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.875rem',
                                                        textDecoration: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        backgroundColor: 'var(--primary)',
                                                        color: 'white'
                                                    }}
                                                >
                                                    📊 Open Report
                                                </a>
                                                {upload.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handleApproval(upload.upload_id, 'APPROVED')}
                                                            disabled={processing}
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleApproval(upload.upload_id, 'REJECTED')}
                                                            disabled={processing}
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(upload.upload_id)}
                                                    disabled={processing}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.875rem',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #ef4444',
                                                        color: '#ef4444'
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Details Modal */}
            {selectedUpload && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="card-title">📄 Upload Details - #{selectedUpload.upload_id}</h2>
                            <p>{selectedUpload.school_name}</p>
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setSelectedUpload(null);
                                setStudents([]);
                            }}
                        >
                            ✕ Close
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <strong>School ID:</strong> {selectedUpload.school_id}
                        </div>
                        <div>
                            <strong>Principal Email:</strong> {selectedUpload.principal_email}
                        </div>
                        <div>
                            <strong>District:</strong> {selectedUpload.district || 'N/A'}
                        </div>
                        <div>
                            <strong>Total Students:</strong> {selectedUpload.total_students}
                        </div>
                        <div>
                            <strong>Status:</strong>{' '}
                            <span className={`badge ${getStatusBadge(selectedUpload.status)}`}>
                                {selectedUpload.status}
                            </span>
                        </div>
                        <div>
                            <strong>Uploaded:</strong> {new Date(selectedUpload.uploaded_at).toLocaleString()}
                        </div>
                    </div>

                    <h3>Student Data Preview</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Class</th>
                                    <th>Roll Number</th>
                                    <th>Responses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.slice(0, 10).map((student, index) => (
                                    <tr key={index}>
                                        <td>{student.student_name}</td>
                                        <td>{student.class}</td>
                                        <td>{student.roll_number}</td>
                                        <td>
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                {Object.keys(JSON.parse(student.response_data || '{}')).length} fields
                                            </small>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {students.length > 10 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                            Showing 10 of {students.length} students
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
