import PDFDocument from 'pdfkit';
import { LeakResult } from '../database/db';
import { AiInvestigationReport } from './aiService';

export function generatePdfReport(
  leak: LeakResult,
  aiReport: AiInvestigationReport,
  reportCode = 'NRX-001'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Nexora AI - Water Leak Investigation Report (${leak.zone})`,
        Author: 'Nexora AI Municipal Water Intelligence',
        Subject: `Suspected Leak Investigation - Zone ${leak.zone}`,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const primaryColor = '#0284c7'; // Sky 600
    const darkNavy = '#0f172a'; // Slate 900
    const slateGray = '#475569'; // Slate 600
    const lightBg = '#f1f5f9'; // Slate 100
    const criticalRed = '#dc2626'; // Red 600

    // Top Header Banner
    doc.rect(40, 40, 515, 60).fill('#0369a1');
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(20).text('NEXORA AI', 55, 52);
    doc.font('Helvetica').fontSize(10).text('MUNICIPAL WATER INTELLIGENCE PLATFORM', 55, 75);

    doc.font('Helvetica-Bold').fontSize(12).text('INVESTIGATION REPORT', 370, 55, { align: 'right', width: 170 });
    doc.font('Helvetica').fontSize(9).text(`Report ID: ${reportCode}`, 370, 72, { align: 'right', width: 170 });
    doc.text(`Date: ${new Date().toLocaleString()}`, 370, 84, { align: 'right', width: 170 });

    doc.moveDown(2);
    let yPos = 115;

    // Report Title
    doc.fillColor(darkNavy).font('Helvetica-Bold').fontSize(16).text('Water Leak Investigation Report', 40, yPos);
    yPos += 24;

    // Subtitle & Status Badge
    doc.font('Helvetica').fontSize(10).fillColor(slateGray);
    doc.text(`Target Infrastructure: Zone ${leak.zone} | Priority Rank #${leak.rank || 1} | Status: ${leak.status}`, 40, yPos);
    yPos += 20;

    // KPI Box Summary
    doc.rect(40, yPos, 515, 64).fill(lightBg);
    
    // Box 1: Zone & Status
    doc.fillColor(slateGray).font('Helvetica').fontSize(8).text('ZONE / STATUS', 55, yPos + 10);
    doc.fillColor(criticalRed).font('Helvetica-Bold').fontSize(14).text(`${leak.zone} (${leak.status})`, 55, yPos + 24);

    // Box 2: Estimated Loss
    doc.fillColor(slateGray).font('Helvetica').fontSize(8).text('ESTIMATED WATER LOSS', 165, yPos + 10);
    doc.fillColor(darkNavy).font('Helvetica-Bold').fontSize(14).text(`${leak.estimated_loss.toLocaleString()} L/day`, 165, yPos + 24);

    // Box 3: Leak Confidence
    doc.fillColor(slateGray).font('Helvetica').fontSize(8).text('LEAK CONFIDENCE', 295, yPos + 10);
    doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(14).text(`${leak.confidence}%`, 295, yPos + 24);

    // Box 4: Risk Score
    doc.fillColor(slateGray).font('Helvetica').fontSize(8).text('PROTOTYPE RISK SCORE', 415, yPos + 10);
    doc.fillColor(darkNavy).font('Helvetica-Bold').fontSize(14).text(`${leak.priority_score} / 100`, 415, yPos + 24);

    yPos += 78;

    // Section 1: Hydraulic Telemetry Diagnostics
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('1. Hydraulic Telemetry & Anomaly Analysis', 40, yPos);
    yPos += 18;

    doc.rect(40, yPos, 515, 56).stroke('#cbd5e1');
    doc.fillColor(darkNavy).font('Helvetica-Bold').fontSize(9);
    doc.text('Metric Parameter', 50, yPos + 8);
    doc.text('Expected Baseline', 190, yPos + 8);
    doc.text('Actual Reading', 320, yPos + 8);
    doc.text('Calculated Anomaly', 440, yPos + 8);

    doc.moveTo(40, yPos + 22).lineTo(555, yPos + 22).stroke('#e2e8f0');

    doc.font('Helvetica').fontSize(9).fillColor(darkNavy);
    doc.text('Pressure Head', 50, yPos + 27);
    doc.text(`${leak.expected_pressure || 50.0} bar`, 190, yPos + 27);
    doc.text(`${leak.actual_pressure || 34.0} bar`, 320, yPos + 27);
    doc.fillColor(criticalRed).text(`-${leak.pressure_anomaly}% Drop`, 440, yPos + 27);

    doc.fillColor(darkNavy);
    doc.text('Mainline Flow', 50, yPos + 42);
    doc.text(`${leak.expected_flow || 100.0} m³/h`, 190, yPos + 42);
    doc.text(`${leak.actual_flow || 131.0} m³/h`, 320, yPos + 42);
    doc.fillColor(criticalRed).text(`+${leak.flow_anomaly}% Surge`, 440, yPos + 42);

    yPos += 72;

    // Section 2: Network Location
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('2. Network Location & Coordinates', 40, yPos);
    yPos += 16;
    doc.font('Helvetica').fontSize(9).fillColor(darkNavy);
    doc.text(
      `Coordinates: ${leak.latitude || '30.3501'}° N, ${leak.longitude || '76.8302'}° E (Simulated Municipal Distribution Grid)`,
      40,
      yPos
    );
    doc.text(
      `Suggested Pipeline Corridor: ${aiReport.suggested_pipeline_segment || 'Main Trunk Zone ' + leak.zone}`,
      40,
      yPos + 12
    );

    yPos += 34;

    // Section 3: AI-Assisted Investigation Recommendation
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('3. AI-Assisted Investigation Recommendation', 40, yPos);
    yPos += 18;

    doc.rect(40, yPos, 515, 155).fill('#f8fafc');
    doc.rect(40, yPos, 515, 155).stroke('#e2e8f0');

    let aiY = yPos + 10;
    doc.fillColor(darkNavy).font('Helvetica-Bold').fontSize(9).text('Anomaly Summary:', 52, aiY);
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(aiReport.anomaly_summary, 52, aiY + 12, { width: 490 });

    aiY += 38;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(darkNavy).text('Hydraulic Deficit & Why Suspicious:', 52, aiY);
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(aiReport.why_suspicious, 52, aiY + 12, { width: 490 });

    aiY += 40;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(darkNavy).text('Estimated Impact & Priority Justification:', 52, aiY);
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(
      `${aiReport.estimated_impact} ${aiReport.priority_explanation}`,
      52,
      aiY + 12,
      { width: 490 }
    );

    yPos += 170;

    // Section 4: Recommended Inspection Action & Worker Instructions
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('4. Recommended Field Actions & Worker Instructions', 40, yPos);
    yPos += 18;

    doc.rect(40, yPos, 515, 95).fill('#f0fdf4');
    doc.rect(40, yPos, 515, 95).stroke('#bbf7d0');

    let actionY = yPos + 8;
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(9).text('Recommended Inspection Protocol:', 52, actionY);
    doc.font('Helvetica').fontSize(8.5).fillColor('#14532d').text(aiReport.recommended_inspection_action, 52, actionY + 12, { width: 490 });

    actionY += 38;
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(9).text('Direct Worker / Field Crew Instructions:', 52, actionY);
    doc.font('Helvetica').fontSize(8.5).fillColor('#14532d').text(aiReport.worker_instructions, 52, actionY + 12, { width: 490 });

    yPos += 110;

    // Footer & Disclaimer
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke('#cbd5e1');
    yPos += 8;
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(slateGray);
    doc.text(
      'Notice: This document is an automated AI-Assisted Investigation Recommendation generated by Nexora AI. Measurements represent prototype estimated water loss calculations. Physical ground confirmation by certified municipal engineering staff is required prior to excavation.',
      40,
      yPos,
      { width: 515, align: 'center' }
    );

    doc.end();
  });
}
