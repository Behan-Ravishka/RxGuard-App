import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = (email, history, insights) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Color Palette
  const primaryColor = [139, 92, 246]; // #8b5cf6 (RxGuard Purple)
  const secondaryColor = [124, 58, 237]; // Darker Purple
  const textColor = [52, 33, 79]; // #34214f

  // --- HEADER ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("Clinical Drug-to-Drug Interaction (DDI) Report by RxGuard", 14, 22);

  // --- 1. PATIENT AND MEDICATION INFORMATION ---
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("1. Patient and Medication Information", 14, 48);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient Identifier: ${email}`, 14, 55);
  doc.text(`Date of Assessment: ${new Date().toLocaleDateString()}`, 14, 61);
  doc.text("Clinical Context: Ambulatory / General Monitoring", 14, 67);

  // Extract all unique active drugs
  const allDrugs = history.flatMap(scan => scan.drugs_detected || []);
  const uniqueDrugs = [...new Set(allDrugs)].filter(Boolean);

  let finalY = 75;

  if (uniqueDrugs.length > 0) {
    autoTable(doc, {
      startY: finalY,
      head: [['#', 'Active Medications (Interacting Agents)']],
      body: uniqueDrugs.map((drug, index) => [index + 1, drug]),
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 10, textColor: textColor },
      margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.text("No active medications recorded.", 14, finalY);
    finalY += 15;
  }

  // --- 2. INTERACTION OVERVIEW & CLINICAL EFFECTS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("2. Interaction Overview & Mechanisms", 14, finalY);
  
  // Filter for scans that actually triggered a warning
  const interactions = history.filter(scan => scan.fda_warning === true || scan.severity_level?.toLowerCase() === 'high' || scan.severity_level?.toLowerCase() === 'moderate');

  if (interactions.length > 0) {
    const interactionBody = interactions.map(scan => [
      (scan.drugs_detected || []).join(' + '),
      (scan.severity_level || 'Moderate').toUpperCase(),
      scan.fda_warning ? "FDA Alert Detected (PK/PD Mechanism Potential)" : "Theoretical/Probable Interaction",
      new Date(scan.created_at).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Interaction Pair', 'Severity Level', 'Clinical Effect / Documentation', 'Log Date']],
      body: interactionBody,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }, // Rose-600 for alerts
      styles: { fontSize: 9, textColor: textColor },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });
    finalY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("No major contraindications or high-severity interactions detected in recent history.", 14, finalY + 6);
    finalY += 15;
  }

  // --- 3. MANAGEMENT AND RECOMMENDATIONS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("3. Management and Recommendations", 14, finalY);

  if (insights && insights.length > 0) {
    const insightsBody = insights.map(i => [
      i.title, 
      i.description
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Monitoring Parameter / Category', 'Action Plan & Clinical Recommendations']],
      body: insightsBody,
      theme: 'grid',
      headStyles: { fillColor: secondaryColor },
      styles: { fontSize: 9, textColor: textColor },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
    });
    finalY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Maintain current dosage. Monitor vital signs and report adverse reactions.", 14, finalY + 6);
    finalY += 15;
  }

  // --- 4. FULL HISTORICAL LOG ---
  // Ensure we don't bleed off the page before adding the header
  if (finalY > pageWidth - 40) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("4. Historical Scan Log", 14, finalY);

  const historyBody = history.slice(0, 10).map(scan => [
    new Date(scan.created_at).toLocaleDateString(),
    (scan.drugs_detected || []).join(', ') || 'None',
    scan.severity_level || 'Low'
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Date', 'Agents Scanned', 'System Assigned Risk']],
    body: historyBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    styles: { fontSize: 9, textColor: textColor },
  });

  // --- FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Generative DDI Report by RxGuard - For clinical reference only. Verify with primary physician.`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`Clinical_DDI_Report_by_RxGuard_${new Date().toISOString().split('T')[0]}.pdf`);
};