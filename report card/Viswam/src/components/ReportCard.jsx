import { useState, useEffect } from 'react';
import fdrLogo from '../assets/fdr-logo-new.png';
import nsfLogo from '../assets/nsf-logo.jpg';
import GradeCard from './GradeCard';
import { Printer, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';

export default function ReportCard() {
    const primaryColor = '#1e3a8a'; // Navy Blue
    const accentColor = '#dc2626'; // Red

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                // Get upload_id from URL query string
                const urlParams = new URLSearchParams(window.location.search);
                let uploadId = urlParams.get('id') || urlParams.get('upload_id');

                // Fallback: check if it's in the hash (some SPAs use hash for routing)
                if (!uploadId && window.location.hash) {
                    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
                    uploadId = hashParams.get('id') || hashParams.get('upload_id');
                }

                if (!uploadId) {
                    setError('No upload ID provided in URL. Please use a link like: ?id=XX');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`/api/report-data/${uploadId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch report data');
                }

                const data = await response.json();
                setReportData(data);
            } catch (err) {
                console.error('Error fetching report:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
                <Loader2 className="animate-spin" size={48} />
                <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>Loading Report Data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
                <div style={{ backgroundColor: '#ef4444', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Process data from API
    const studentData = reportData.students
        .filter(s => {
            // Further safety check to filter out metadata roles if any slipped through
            const responses = s.response_data || {};
            const roll = String(responses['ROLL NO'] || responses['Roll No'] || '').toLowerCase();
            return roll !== 'question id' && (s.student_name || responses['NAME']);
        })
        .map(s => {
            const responses = s.response_data || {};

            // Helper to find percentage values from keys like "Math %", "Science %"
            const getScore = (subjectPattern) => {
                const key = Object.keys(responses).find(k =>
                    k.toLowerCase().includes(subjectPattern.toLowerCase()) && k.includes('%')
                );
                return parseFloat(responses[key] || 0);
            };

            return {
                name: s.student_name || responses['NAME'] || 'Unknown Student',
                grade: s.class || responses['CLASS'] || 'N/A',
                eng: getScore('English'),
                math: getScore('Math'),
                sci: getScore('Science')
            };
        });

    const totalRegistered = reportData.total_students;
    const totalParticipated = studentData.length;
    const attendancePercent = totalRegistered > 0 ? Math.round((totalParticipated / totalRegistered) * 100) : 0;

    // Subject Colors
    const colors = {
        english: '#4338ca',
        math: '#15803d',
        science: '#b45309'
    };

    // Calculate Averages
    const calculateAverage = (subjectKey) => {
        if (studentData.length === 0) return 0;
        const total = studentData.reduce((acc, curr) => acc + (curr[subjectKey] || 0), 0);
        return Math.round(total / studentData.length);
    };

    const englishAvg = calculateAverage('eng');
    const mathAvg = calculateAverage('math');
    const scienceAvg = calculateAverage('sci');

    const chartData = [
        { name: 'English', score: englishAvg, color: colors.english },
        { name: 'Maths', score: mathAvg, color: colors.math },
        { name: 'Science', score: scienceAvg, color: colors.science }
    ];

    // Extraction logic for strengths/improvements would normally be based on analysis
    // For now, using these as placeholders or could be derived from response_data if available
    const englishStrengths = { [studentData[0]?.grade || 7]: ["Grammar - 80%", "Reading - 75%", "Vocabulary - 70%"] };
    const mathStrengths = { [studentData[0]?.grade || 7]: ["Arithmetic - 85%", "Algebra - 78%", "Geometry - 72%"] };
    const scienceStrengths = { [studentData[0]?.grade || 7]: ["Physics - 82%", "Biology - 75%", "Chemistry - 70%"] };

    const englishImprovements = { [studentData[0]?.grade || 7]: ["Composition - 45%", "Literature - 40%"] };
    const mathImprovements = { [studentData[0]?.grade || 7]: ["Trigonometry - 50%", "Statistics - 45%"] };
    const scienceImprovements = { [studentData[0]?.grade || 7]: ["Environments - 50%", "Organic - 45%"] };

    const renderTopicList = (title, items, color, isStrength = false) => (
        <div style={{ marginBottom: '0.5rem' }}>
            <h5 style={{
                fontSize: '0.85rem',
                margin: '0 0 0.6rem 0',
                color: isStrength ? '#15803d' : '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: '600'
            }}>
                {isStrength ? '✅ Strengths' : '⚠️ Areas for Improvement'}
            </h5>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#334155' }}>
                {(items || []).map((item, idx) => {
                    const parts = item.split(/[-:]/);
                    const text = parts[0];
                    const score = parts[1] || '';
                    return (
                        <li key={idx} style={{ marginBottom: '0.4rem' }}>
                            <span>{text}</span>
                            {score && <span style={{ fontWeight: 'bold', color: isStrength ? '#166534' : '#b45309', fontSize: '0.7rem', marginLeft: '0.2rem' }}>{score}</span>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );



    return (
        <div className="report-wrapper" style={{
            backgroundColor: '#525659', // Dark background for PDF viewer feel
            padding: '2rem 0',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem' // Space between pages
        }}>



            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .report-wrapper {
                        padding: 0 !important;
                        background-color: white !important;
                        display: block !important;
                        gap: 0 !important;
                    }
                    .page {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                        page-break-after: always;
                    }
                    .page:last-child { page-break-after: auto; }
                }
            `}</style>

            {/* PAGE 1: School Overview */}
            <div className="page" style={{
                width: '210mm',
                height: '297mm', // Strict A4 Height
                backgroundColor: 'white',
                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                padding: '10mm',
                boxSizing: 'border-box',
                color: '#1e293b',
                position: 'relative',
                overflow: 'hidden' // Ensure content stays within paper
            }}>
                {/* Header */}
                <header style={{
                    borderBottom: `2px solid ${primaryColor} `,
                    paddingBottom: '0.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    position: 'relative' // Added for absolute positioning of print button
                }}>
                    {/* Print Button - Moved to Header */}
                    <button
                        onClick={handlePrint}
                        style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#F1F5F9', // Subtle background
                            color: primaryColor,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${primaryColor}`,
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                        className="no-print hover-lift"
                        title="Print Report"
                    >
                        <Printer size={14} />
                        Print
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginBottom: '0.2rem'
                    }}>
                        <img
                            src={fdrLogo}
                            alt="FDR Logo"
                            style={{ height: '70px', objectFit: 'contain' }}
                        />
                        <h1 style={{
                            margin: 0,
                            color: primaryColor,
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            lineHeight: '1.2'
                        }}>
                            Foundation for Democratic Reforms <span style={{ fontSize: '1.1rem', color: accentColor, fontWeight: '600' }}>(FDR)</span>
                        </h1>
                        <img
                            src={nsfLogo}
                            alt="NSF Logo"
                            style={{ height: '70px', objectFit: 'contain' }}
                        />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: '600', color: '#475569' }}>
                        School Performance Report
                    </h2>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        fontSize: '0.85rem',
                        color: '#64748B',
                        marginTop: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <span><strong>School:</strong> {reportData.school_name}</span>
                        <span>•</span>
                        <span><strong>Assessment:</strong> Sodhana 1</span>
                        <span>•</span>
                        <span><strong>Date:</strong> {reportData.report_date}</span>
                        <span>•</span>
                        <span><strong>Grade:</strong> {studentData[0]?.grade || 'N/A'}</span>
                    </div>
                </header>

                {/* Overview Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>

                    {/* Participation - Key Metrics Style */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: primaryColor, borderLeft: `4px solid ${primaryColor}`, paddingLeft: '0.5rem' }}>Participation</h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '0.8rem'
                        }}>
                            <div style={{
                                backgroundColor: '#F8FAFC',
                                borderRadius: '8px',
                                padding: '1rem',
                                border: '1px solid #E2E8F0',
                                textAlign: 'center'
                            }}>
                                <div style={{ height: '100px', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[{ value: 100 }]}
                                                cx="50%"
                                                cy="100%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill={primaryColor}
                                                stroke="none"
                                                dataKey="value"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '25%', // Adjust based on arc 
                                        textAlign: 'center',
                                        width: '100%'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: primaryColor, lineHeight: '1' }}>{attendancePercent}%</div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Attendance</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div style={{
                                    backgroundColor: '#FFF',
                                    borderRadius: '8px',
                                    padding: '0.8rem',
                                    border: '1px solid #E2E8F0',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{totalRegistered}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Registered</div>
                                </div>
                                <div style={{
                                    backgroundColor: '#FFF',
                                    borderRadius: '8px',
                                    padding: '0.8rem',
                                    border: '1px solid #E2E8F0',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{totalParticipated}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Participated</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subject Performance Breakdown - Graph */}
                    <div>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: primaryColor, borderLeft: `4px solid ${primaryColor}`, paddingLeft: '0.5rem' }}>Subject Performance</h3>
                        <div style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            height: '180px',
                            backgroundColor: 'white',
                            padding: '1rem'
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={45}>
                                        <LabelList dataKey="score" position="top" formatter={(value) => `${value}%`} fontSize={12} fontWeight="bold" />
                                        {
                                            chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Focus Areas */}
                <div>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: primaryColor, borderLeft: `4px solid ${primaryColor}`, paddingLeft: '0.5rem' }}>Focus Areas & Remarks</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', alignItems: 'start' }}>

                        {/* English */}
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${colors.english}` }}>
                                <h4 style={{ margin: 0, color: colors.english, textTransform: 'uppercase', fontSize: '0.9rem' }}>English</h4>
                            </div>
                            <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {renderTopicList('✅ Strengths', englishStrengths[studentData[0]?.grade || 7], colors.english, true)}
                                <div style={{ height: '1.5rem' }}></div>
                                {renderTopicList('⚠️ Improvements', englishImprovements[studentData[0]?.grade || 7], colors.english, false)}
                            </div>
                        </div>

                        {/* Math */}
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${colors.math}` }}>
                                <h4 style={{ margin: 0, color: colors.math, textTransform: 'uppercase', fontSize: '0.9rem' }}>Mathematics</h4>
                            </div>
                            <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {renderTopicList('✅ Strengths', mathStrengths[studentData[0]?.grade || 7], colors.math, true)}
                                <div style={{ height: '1.5rem' }}></div>
                                {renderTopicList('⚠️ Improvements', mathImprovements[studentData[0]?.grade || 7], colors.math, false)}
                            </div>
                        </div>

                        {/* Science */}
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${colors.science}` }}>
                                <h4 style={{ margin: 0, color: colors.science, textTransform: 'uppercase', fontSize: '0.9rem' }}>Science</h4>
                            </div>
                            <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {renderTopicList('✅ Strengths', scienceStrengths[studentData[0]?.grade || 7], colors.science, true)}
                                <div style={{ height: '1.5rem' }}></div>
                                {renderTopicList('⚠️ Improvements', scienceImprovements[studentData[0]?.grade || 7], colors.science, false)}
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: '#94A3B8',
                    position: 'absolute',
                    bottom: '10mm',
                    left: 0,
                    right: 0
                }}>
                    Automatic System Generated Report • Sodhana Assessment • Page 1
                </div>

            </div>

            {/* PAGE 2: Student Details */}
            <div className="page" style={{
                width: '210mm',
                height: '297mm', // Strict A4 Height
                backgroundColor: 'white',
                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                padding: '10mm',
                boxSizing: 'border-box',
                color: '#1e293b',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Header Page 2 */}
                <header style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.2rem' }}>
                        <img src={fdrLogo} alt="FDR Logo" style={{ height: '50px', objectFit: 'contain' }} />
                        <h1 style={{ margin: 0, color: primaryColor, fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Foundation for Democratic Reforms
                        </h1>
                        <img src={nsfLogo} alt="NSF Logo" style={{ height: '50px', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', margin: '0.5rem 0', fontWeight: '600', color: '#475569' }}>Student Performance Report</h2>
                </header>

                <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: primaryColor, borderLeft: `4px solid ${primaryColor}`, paddingLeft: '0.5rem' }}>Detailed Student Scores</h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', color: '#1e293b', textAlign: 'left' }}>
                            <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0' }}>Student Name</th>
                            <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0' }}>Grade</th>
                            <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', color: colors.english }}>English %</th>
                            <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', color: colors.math }}>Maths %</th>
                            <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', color: colors.science }}>Science %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentData.map((student, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.8rem', fontWeight: '500' }}>{student.name}</td>
                                <td style={{ padding: '0.8rem', color: '#64748B' }}>{student.grade}</td>
                                <td style={{ padding: '0.8rem', fontWeight: '600' }}>{student.eng}%</td>
                                <td style={{ padding: '0.8rem', fontWeight: '600' }}>{student.math}%</td>
                                <td style={{ padding: '0.8rem', fontWeight: '600' }}>{student.sci}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: '#94A3B8',
                    position: 'absolute',
                    bottom: '10mm',
                    left: 0,
                    right: 0
                }}>
                    Automatic System Generated Report • Sodhana Assessment • Page 2
                </div>
            </div>

        </div >
    );
}
