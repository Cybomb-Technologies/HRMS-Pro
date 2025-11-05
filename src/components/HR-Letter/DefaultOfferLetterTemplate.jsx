// src/components/OfferLetters/DefaultOfferLetterTemplate.jsx
import React from 'react';

const DefaultOfferLetterTemplate = ({
    company_name = "Cybomb Technologies LLP",
    company_address = "Prime Plaza, Chennai",
    company_email = "hr@cybomb.com",
    company_contact = "+91-XXXXXXXXXX",
    offer_date = "2025-11-03",
    candidate_name = "SANTHOSH K",
    candidate_address = "",
    email = "",
    phone = "",
    designation = "Full Stack Developer",
    department = "Development",
    employment_type = "Full-time",
    reporting_manager = "Project Lead",
    work_location = "Chennai (Hybrid)",
    date_of_joining = "2025-11-05",
    ctc = "600000",
    basic_salary = "45000",
    allowances = "5000",
    bonus = "",
    deductions = "",
    net_salary = "₹50,000.00",
    working_hours = "9:00 AM - 6:00 PM",
    probation_period = "3 months",
    notice_period = "30 days",
    benefits = "Health insurance, paid time off, flexible work hours",
    offer_expiry_date = "2025-11-10",
    hr_name = "Mr. Rahul Kumar",
    hr_designation = "HR Manager",
}) => {

    // Modern Professional Palette
    const primaryColor = '#1f2937'; // Dark Slate
    const secondaryColor = '#4b5563'; // Medium Gray
    const accentColor = '#3b82f6'; // Bright Blue
    const softBackground = '#f9fafb';
    const borderSubtle = '#e5e7eb';

    const styles = {
        body: {
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: 1.6,
            color: secondaryColor,
            maxWidth: '850px',
            margin: '0 auto',
            padding: '40px',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${borderSubtle}`,
            borderRadius: '10px',
        },
        header: {
            textAlign: 'left',
            borderBottom: `2px solid ${accentColor}`,
            paddingBottom: '20px',
            marginBottom: '30px',
            padding: '0',
        },
        companyName: {
            color: primaryColor,
            fontSize: '28px',
            fontWeight: '900',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
        },
        companyAddress: {
            color: secondaryColor,
            fontSize: '14px',
            margin: '5px 0 0 0',
        },
        date: {
            textAlign: 'right',
            marginBottom: '25px',
            color: primaryColor,
            fontWeight: 'normal',
            fontSize: '14px',
            padding: '10px 0',
            display: 'block',
        },
        section: {
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: softBackground,
            borderRadius: '8px',
            borderLeft: `4px solid ${accentColor}`,
        },
        sectionTitle: {
            color: primaryColor,
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px',
            paddingBottom: '5px',
            borderBottom: `1px solid ${borderSubtle}`,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        candidateInfo: {
            padding: '25px',
            borderRadius: '8px',
            marginBottom: '25px',
            border: `1px solid ${borderSubtle}`,
            backgroundColor: '#f0f4ff', // Light Blue tint
        },
        signatureSection: {
            marginTop: '60px',
            padding: '30px',
            backgroundColor: softBackground,
            borderRadius: '10px',
            border: `1px solid ${borderSubtle}`,
        },
        signatureLine: {
            borderTop: '1px solid #9ca3af',
            width: '300px',
            marginTop: '60px',
        },
        highlight: {
            backgroundColor: '#dbeafe', // Lighter Blue
            padding: '4px 8px',
            fontWeight: 'bold',
            borderRadius: '4px',
            border: `1px solid ${accentColor}`,
            color: primaryColor,
            display: 'inline-block',
        },
        compensationTable: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 5px',
            margin: '15px 0',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
        tableCell: {
            padding: '12px 15px',
            fontSize: '14px',
        },
        tableHeaderCell: {
            fontWeight: '600',
            width: '40%',
            color: primaryColor,
            backgroundColor: softBackground,
            borderRadius: '4px 0 0 4px',
            borderRight: `1px solid ${borderSubtle}`,
        },
        tableValueCell: {
            borderRadius: '0 4px 4px 0',
            border: `1px solid ${borderSubtle}`,
            borderLeft: 'none',
        },
        termsListItem: {
            padding: '12px 0',
            borderBottom: `1px dotted ${borderSubtle}`,
            fontSize: '14px',
            display: 'flex',
        },
        termsListStrong: {
            color: primaryColor,
            minWidth: '180px',
            fontWeight: '600',
        },
        acceptanceSection: {
            backgroundColor: '#d1fae5',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid #059669`,
            margin: '25px 0',
            textAlign: 'center',
            color: '#059669',
        },
    };

    const renderTableRow = (label, value, isBold = false, isHighlight = false) => (
        <tr>
            <td style={{ ...styles.tableCell, ...styles.tableHeaderCell }}>{label}</td>
            <td style={{ 
                ...styles.tableCell, 
                ...styles.tableValueCell,
                fontWeight: isBold || isHighlight ? 'bold' : 'normal',
                color: isHighlight ? accentColor : primaryColor,
                fontSize: isHighlight ? '16px' : '14px'
            }}>
                {value}
            </td>
        </tr>
    );

    return (
        <div style={styles.body}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.companyName}>{company_name}</h1>
                <p style={styles.companyAddress}>{company_address}</p>
                <p style={{...styles.companyAddress, marginTop: '2px'}}>
                    📧 {company_email} | 📞 {company_contact}
                </p>
            </div>

            {/* Date */}
            <p style={styles.date}>Offer Date: {offer_date}</p>

            {/* Candidate Info */}
            <div style={styles.candidateInfo}>
                <p style={{ fontSize: '16px', margin: '0 0 10px 0', fontWeight: 'bold', color: primaryColor }}>
                    Dear {candidate_name},
                </p>
                {candidate_address && <p style={{ margin: '5px 0', fontSize: '14px' }}>{candidate_address}</p>}
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    {email} {phone && `| ${phone}`}
                </p>
            </div>

            {/* Offer Section */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>🎯 EMPLOYMENT OFFER</div>
                <p>We are delighted to offer you the position of <span style={styles.highlight}>{designation}</span> at {company_name}. This letter outlines the key terms of your employment.</p>
            </div>

            {/* Position Details */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>📋 ROLE AND LOGISTICS</div>
                <table style={styles.compensationTable}>
                    <tbody>
                        {renderTableRow('Designation', designation)}
                        {renderTableRow('Department', department)}
                        {renderTableRow('Employment Type', employment_type)}
                        {renderTableRow('Reporting Manager', reporting_manager)}
                        {renderTableRow('Work Location', work_location)}
                        {renderTableRow('Date of Joining', date_of_joining, true, true)}
                    </tbody>
                </table>
            </div>

            {/* Compensation Package */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>💰 COMPENSATION SUMMARY</div>
                <table style={styles.compensationTable}>
                    <tbody>
                        {renderTableRow('Annual CTC', <strong style={{color: accentColor}}>{`₹${ctc}`}</strong>, true, false)}
                        {renderTableRow('Basic Salary (Monthly)', `₹${basic_salary}`)}
                        {renderTableRow('Allowances (Monthly)', `₹${allowances}`)}
                        {bonus && renderTableRow('Bonus/Incentives', bonus)}
                        {deductions && renderTableRow('Deductions/Contributions', deductions)}
                        {renderTableRow('Net Monthly Salary', net_salary, true, true)}
                    </tbody>
                </table>
            </div>

            {/* Terms & Conditions */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>📝 GENERAL TERMS</div>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li style={styles.termsListItem}>
                        <span style={styles.termsListStrong}>Working Hours:</span> 
                        {working_hours}
                    </li>
                    <li style={styles.termsListItem}>
                        <span style={styles.termsListStrong}>Probation Period:</span> 
                        {probation_period}
                    </li>
                    <li style={styles.termsListItem}>
                        <span style={styles.termsListStrong}>Notice Period:</span> 
                        {notice_period}
                    </li>
                    <li style={{...styles.termsListItem, borderBottom: 'none'}}>
                        <span style={styles.termsListStrong}>Benefits:</span> 
                        {benefits}
                    </li>
                </ul>
            </div>

            {/* Acceptance of Offer */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>✅ ACCEPTANCE</div>
                <div style={styles.acceptanceSection}>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                        Please confirm your acceptance by signing and returning this letter.
                    </p>
                    <p style={{ color: primaryColor }}>
                        This offer must be accepted by <strong>{offer_expiry_date}</strong>.
                    </p>
                </div>
            </div>

            {/* Signature Section */}
            <div style={styles.signatureSection}>
                <p>Yours sincerely,</p>
                <div style={styles.signatureLine}></div>
                <p style={{ marginTop: '15px', fontWeight: 'bold', color: primaryColor }}>
                    <strong>{hr_name}</strong><br />
                    {hr_designation}<br />
                    {company_name}
                </p>
            </div>

            {/* Footer */}
            <div style={{textAlign: 'center', marginTop: '40px', fontSize: '12px', color: secondaryColor, borderTop: `1px solid ${borderSubtle}`, paddingTop: '15px'}}>
                <p><em>This document is confidential and proprietary to {company_name}.</em></p>
                <p>{company_address} | {company_email}</p>
            </div>
        </div>
    );
};

export default DefaultOfferLetterTemplate;