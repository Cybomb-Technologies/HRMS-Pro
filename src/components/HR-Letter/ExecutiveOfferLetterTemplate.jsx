// src/components/OfferLetters/ExecutiveOfferLetterTemplate.jsx
import React from 'react';

const ExecutiveOfferLetterTemplate = ({
    company_name = "Cybomb Technologies LLP",
    company_address = "Prime Plaza, Chennai",
    offer_date = "2025-11-03",
    candidate_name = "SANTHOSH K",
    candidate_address = "",
    title = "Chief Technology Officer",
    annual_base_salary = "₹2,500,000",
    target_bonus_percentage = "Up to 30% of base salary",
    equity_grants = "10,000 Restricted Stock Units (RSUs)",
    severance_details = "12 months base salary upon involuntary termination",
    reporting_to = "The Board of Directors",
    start_date = "2025-11-05",
    hr_contact = "Ms. Priya Sharma - Head of Governance & HR",
}) => {

    // Bold, Corporate Palette
    const primaryColor = '#003366'; // Dark Navy/Corporate Blue
    const secondaryColor = '#374151'; // Darker Text
    const accentColor = '#10b981'; // Success Green
    const softBackground = '#f9fafb';
    const borderSubtle = '#e5e7eb';

    const styles = {
        body: {
            fontFamily: 'Georgia, serif', // Formal font
            lineHeight: 1.8,
            color: secondaryColor,
            maxWidth: '900px',
            margin: '0 auto',
            padding: '50px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 25px rgba(0,0,0,0.1)',
            border: `1px solid ${borderSubtle}`,
        },
        header: {
            textAlign: 'left',
            borderBottom: `5px solid ${primaryColor}`,
            paddingBottom: '25px',
            marginBottom: '40px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
            padding: '0',
        },
        companyName: {
            color: primaryColor,
            fontSize: '38px',
            fontWeight: '900',
            margin: '0',
            letterSpacing: '0.5px',
        },
        date: {
            textAlign: 'right',
            marginBottom: '35px',
            color: primaryColor,
            fontStyle: 'normal',
            fontSize: '15px',
            fontWeight: '600',
            padding: '10px 15px',
            backgroundColor: '#e0f2fe', // Light blue background
            borderRadius: '5px',
            display: 'inline-block',
            float: 'right',
        },
        section: {
            marginBottom: '40px',
            padding: '25px',
            backgroundColor: softBackground,
            borderRadius: '8px',
            borderLeft: `5px solid ${primaryColor}`,
        },
        sectionTitle: {
            color: primaryColor,
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '15px',
            paddingBottom: '8px',
            borderBottom: `2px solid ${primaryColor}`,
            textTransform: 'uppercase',
        },
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 8px',
            margin: '10px 0',
        },
        tableCell: {
            padding: '15px 0',
            fontSize: '16px',
        },
        tableHeaderCell: {
            fontWeight: 'bold',
            width: '30%',
            color: secondaryColor,
            backgroundColor: '#ffffff',
        },
        highlightBlock: {
            backgroundColor: '#fffbeb', // Light yellow for attention
            padding: '25px',
            borderRadius: '8px',
            margin: '25px 0',
            border: `2px dashed ${primaryColor}`,
        },
        signatureLine: {
            borderTop: '2px solid #333',
            width: '350px',
            marginTop: '80px',
        },
        executiveBadge: {
            backgroundColor: primaryColor,
            color: 'white',
            padding: '5px 15px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
        },
         footer: {
            textAlign: 'center',
            marginTop: '40px',
            fontSize: '12px',
            color: '#666',
            borderTop: `1px solid ${borderSubtle}`,
            paddingTop: '15px',
        }
    };

    const renderTableRow = (label, value, isHighlight = false) => (
        <tr style={{ borderBottom: `1px solid ${borderSubtle}` }}>
            <td style={{ ...styles.tableCell, ...styles.tableHeaderCell }}>{label}</td>
            <td style={{ 
                ...styles.tableCell, 
                fontWeight: isHighlight ? 'bold' : 'normal',
                color: isHighlight ? accentColor : primaryColor,
            }}>{value}</td>
        </tr>
    );

    return (
        <div style={styles.body}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.companyName}>{company_name}</h1>
                <p style={{ color: secondaryColor, fontSize: '15px', margin: '5px 0' }}>{company_address}</p>
                <p style={{ color: primaryColor, fontSize: '18px', margin: '15px 0', fontWeight: 'bold' }}>EXECUTIVE EMPLOYMENT AGREEMENT</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={styles.date}>Date: {offer_date}</div>
            </div>
            
            <p style={{ fontSize: '18px', margin: '20px 0 40px 0' }}>Dear <strong style={{color: primaryColor}}>{candidate_name}</strong>,</p>
            
            {/* Introductory Section */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>OFFER SUMMARY</div>
                <p>It is with immense pleasure that we extend this formal offer for you to join {company_name} as our <span style={styles.executiveBadge}>{title}</span>, effective {start_date}. We are confident that your leadership will be pivotal in shaping our strategic direction.</p>
            </div>

            {/* Compensation */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>1. EXECUTIVE COMPENSATION</div>
                <table style={styles.table}>
                    <tbody>
                        {renderTableRow('Executive Title', title)}
                        {renderTableRow('Reporting To', reporting_to)}
                        {renderTableRow('Base Annual Salary', <strong style={{color: accentColor}}>{annual_base_salary}</strong>, true)}
                        {renderTableRow('Target Annual Bonus', target_bonus_percentage)}
                        {renderTableRow('Initial Equity Grant', equity_grants)}
                        {renderTableRow('Effective Start Date', <strong>{start_date}</strong>, true)}
                    </tbody>
                </table>
            </div>

            {/* Severance Clause */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>2. SEVERANCE PROTECTION</div>
                <div style={styles.highlightBlock}>
                    <p style={{ margin: 0, fontSize: '15px', color: primaryColor, fontWeight: 'bold' }}>
                        Severance Term: 
                        <span style={{color: '#991b1b', marginLeft: '10px'}}>{severance_details}</span>
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>Details are governed by the attached Executive Severance Plan.</p>
                </div>
            </div>

            {/* Acceptance */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>3. ACCEPTANCE</div>
                <p>This offer is contingent upon your successful completion of our standard background checks and execution of the attached governance agreements (IP, Confidentiality, etc.).</p>
                <p style={{ marginTop: '15px', fontWeight: 'bold', color: primaryColor }}>
                    Please sign and return this agreement by {offer_date}.
                </p>
            </div>

            {/* Signature */}
            <div style={{ marginTop: '60px', padding: '30px', backgroundColor: softBackground, borderRadius: '8px' }}>
                <p>Sincerely,</p>
                <div style={styles.signatureLine}></div>
                <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                    <strong>{hr_contact}</strong><br />
                    Head of Governance & HR<br />
                    {company_name}
                </p>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p>Executive Compensation Committee | {company_name}</p>
                <p><em>Confidential & Proprietary Document.</em></p>
            </div>
        </div>
    );
};

export default ExecutiveOfferLetterTemplate;