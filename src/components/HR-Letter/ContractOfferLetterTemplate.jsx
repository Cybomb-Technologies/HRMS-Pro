// src/components/OfferLetters/ContractOfferLetterTemplate.jsx
import React from 'react';

const ContractOfferLetterTemplate = ({
    company_name = "Cybomb Technologies LLP",
    company_address = "Prime Plaza, Chennai",
    offer_date = "2025-11-03",
    contractor_name = "SANTHOSH K",
    contractor_address = "",
    project_name = "HR Management System Development",
    fixed_fee = "₹500,000",
    payment_schedule = "30% upfront, 40% upon milestone completion, 30% upon final delivery",
    start_date = "2025-11-05",
    end_date = "2026-02-05",
    deliverables_summary = "Development and deployment of the complete HRMS including employee portal, attendance system, payroll integration, and reporting dashboard.",
    ip_rights = "All intellectual property, including source code, documentation, and related materials developed during this project shall be the sole property of Cybomb Technologies LLP.",
    project_manager = "Mr. Rahul Kumar",
}) => {

    // Project-Focused Palette
    const primaryColor = '#059669'; // Green (Trust/Completion)
    const secondaryColor = '#374151'; // Dark Text
    const highlightBg = '#f0fdf4'; // Light Green
    const borderSubtle = '#d1fae5';

    const styles = {
        body: {
            fontFamily: 'Verdana, sans-serif',
            lineHeight: 1.7,
            color: secondaryColor,
            maxWidth: '850px',
            margin: '0 auto',
            padding: '40px',
            backgroundColor: '#ffffff',
            border: `1px solid ${borderSubtle}`,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            borderRadius: '10px',
        },
        header: {
            textAlign: 'center',
            borderBottom: `4px solid ${primaryColor}`,
            paddingBottom: '20px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #f9fafb 0%, #d1fae5 100%)',
            padding: '25px',
            borderRadius: '8px 8px 0 0',
        },
        companyName: {
            color: primaryColor,
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
        },
        date: {
            textAlign: 'right',
            marginBottom: '20px',
            fontSize: '14px',
            color: secondaryColor,
            fontWeight: 'bold',
            padding: '10px 15px',
            backgroundColor: '#f3f4f6',
            borderRadius: '5px',
            display: 'inline-block',
            float: 'right',
        },
        section: {
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: `1px solid ${borderSubtle}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
        sectionTitle: {
            color: primaryColor,
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '5px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 5px',
            margin: '15px 0',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
        },
        tableCell: {
            padding: '12px',
            fontSize: '14px',
        },
        tableHeaderCell: {
            fontWeight: '600',
            width: '35%',
            color: secondaryColor,
            backgroundColor: highlightBg,
            borderRadius: '4px 0 0 4px',
            borderRight: '1px solid #d1fae5',
        },
        tableValueCell: {
            border: '1px solid #d1fae5',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
        },
        termHighlight: {
            backgroundColor: '#ccfbf1',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            border: `1px solid ${primaryColor}`,
            color: primaryColor,
            display: 'inline-block',
        },
        ipBox: {
            fontSize: '14px',
            lineHeight: '1.6',
            backgroundColor: highlightBg,
            padding: '15px',
            borderRadius: '5px',
            border: `1px solid ${borderSubtle}`,
            borderLeft: `3px solid ${primaryColor}`,
        },
        signatureLine: {
            borderTop: '1px solid #9ca3af',
            width: '300px',
            marginTop: '60px',
        },
        footer: {
            textAlign: 'center',
            marginTop: '50px',
            fontSize: '12px',
            color: '#6b7280',
            borderTop: `1px solid ${borderSubtle}`,
            paddingTop: '20px',
        }
    };

    const renderTableRow = (label, value, isHighlight = false) => (
        <tr>
            <td style={{ ...styles.tableCell, ...styles.tableHeaderCell }}>{label}</td>
            <td style={{ 
                ...styles.tableCell,
                ...styles.tableValueCell,
                fontWeight: isHighlight ? 'bold' : 'normal',
                color: isHighlight ? primaryColor : 'inherit',
            }}>{value}</td>
        </tr>
    );

    return (
        <div style={styles.body}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.companyName}>{company_name}</h1>
                <p style={{ color: secondaryColor, fontSize: '14px', margin: '5px 0', fontWeight: '500' }}>{company_address}</p>
                <p style={{ color: primaryColor, fontSize: '16px', margin: '15px 0', fontWeight: 'bold' }}>
                    INDEPENDENT CONTRACTOR AGREEMENT
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={styles.date}>Date: {offer_date}</div>
            </div>

            <p style={{ fontSize: '16px', margin: '20px 0 30px 0', fontWeight: 'bold', color: primaryColor }}>
                Subject: Contract Agreement for {project_name}
            </p>
            <p style={{ fontSize: '15px', marginBottom: '30px' }}>
                Dear <strong>{contractor_name}</strong>,
            </p>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>1. PROJECT & TERM DETAILS</div>
                <table style={styles.table}>
                    <tbody>
                        {renderTableRow('Project Name', project_name)}
                        {renderTableRow('Contract Start Date', <span style={styles.termHighlight}>{start_date}</span>, true)}
                        {renderTableRow('Contract End Date', <span style={styles.termHighlight}>{end_date}</span>, true)}
                        {renderTableRow('Project Manager', project_manager)}
                    </tbody>
                </table>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>2. SCOPE OF WORK & DELIVERABLES</div>
                <p style={{ fontWeight: 'bold', color: secondaryColor, fontSize: '15px' }}>Summary of Deliverables:</p>
                <div style={{...styles.ipBox, borderLeft: `3px solid ${primaryColor}`}}>
                    {deliverables_summary}
                </div>
                <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '13px', color: secondaryColor }}>
                    A detailed Statement of Work (SOW) is incorporated herein by reference.
                </p>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>3. COMPENSATION & PAYMENT</div>
                <table style={styles.table}>
                    <tbody>
                        {renderTableRow('Fixed Total Fee', <strong style={{ color: primaryColor, fontSize: '16px' }}>{fixed_fee}</strong>, true, true)}
                        {renderTableRow('Payment Schedule', payment_schedule)}
                        {renderTableRow('Invoicing Terms', 'Net 15 days from milestone approval')}
                        {renderTableRow('Contractor Responsibility', 'Taxes and Insurance')}
                    </tbody>
                </table>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>4. INTELLECTUAL PROPERTY & CONFIDENTIALITY</div>
                <p style={{ color: primaryColor, fontWeight: 'bold', fontSize: '15px' }}>IP Rights:</p>
                <div style={styles.ipBox}>
                    {ip_rights}
                </div>
            </div>

            <p style={{ marginTop: '40px', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', color: secondaryColor }}>
                Please confirm your acceptance of these terms by signing below and returning this agreement.
            </p>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', gap: '50px' }}>
                {/* Company Signature */}
                <div style={{ flex: 1, paddingRight: '20px' }}>
                    <p style={{ fontWeight: 'bold', color: primaryColor }}>For {company_name}:</p>
                    <div style={styles.signatureLine}></div>
                    <p style={{ marginTop: '10px', color: secondaryColor, fontSize: '14px' }}>
                        <strong>{project_manager}</strong><br />
                        Project Manager<br />
                        {company_name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Date: ___________</p>
                </div>

                {/* Contractor Signature */}
                <div style={{ flex: 1, paddingLeft: '20px' }}>
                    <p style={{ fontWeight: 'bold', color: primaryColor }}>Agreed and Accepted by Contractor:</p>
                    <div style={styles.signatureLine}></div>
                    <p style={{ marginTop: '10px', color: secondaryColor, fontSize: '14px' }}>
                        <strong>{contractor_name}</strong><br />
                        Independent Contractor<br />
                        {contractor_address}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Date: ___________</p>
                </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p><em>This contract is governed by the laws of the State of Tamil Nadu, India.</em></p>
                <p>{company_name} | {company_address}</p>
            </div>
        </div>
    );
};

export default ContractOfferLetterTemplate;