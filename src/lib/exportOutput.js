// === HIVE COMMAND — Output Export Utility ===
// Export agent outputs as PDF, DOCX, or email

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// ─── Shared Helpers ───────────────────────────

function sanitizeFilename(title) {
  return title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').slice(0, 60);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── PDF Export ───────────────────────────────

export async function exportToPDF(output) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header bar
  doc.setFillColor(10, 10, 14); // --bg-void
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 184, 0); // --accent-warning / amber
  doc.text('HIVE COMMAND', margin, 15);

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // --text-tertiary
  doc.text('AI Agent Swarm Operations Dashboard', margin, 22);

  // Output type badge
  doc.setFontSize(7);
  doc.setTextColor(0, 255, 136);
  doc.text((output.type || 'DOCUMENT').toUpperCase(), pageWidth - margin, 15, { align: 'right' });

  // Status badge
  const statusColors = {
    pending_review: [255, 184, 0],
    approved: [0, 255, 136],
    rejected: [255, 51, 68],
    revision_needed: [0, 212, 255],
  };
  const sc = statusColors[output.status] || [156, 163, 175];
  doc.setTextColor(...sc);
  doc.text((output.status || '').toUpperCase().replace('_', ' '), pageWidth - margin, 22, { align: 'right' });

  y = 45;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  const titleLines = doc.splitTextToSize(output.title || 'Untitled Output', contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 5;

  // Separator line
  doc.setDrawColor(255, 184, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  y += 8;

  // Meta info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);

  const metaLines = [
    `Agent: ${output.agent || output.agentId || 'Unknown'}`,
    `Venture: ${output.venture || 'N/A'}`,
    `Created: ${formatDate(output.created || output.createdAt)}`,
    `Status: ${(output.status || '').replace('_', ' ')}`,
  ];
  if (output.url) metaLines.push(`URL: ${output.url}`);

  metaLines.forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 8;

  // Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);

  const content = output.content || output.preview || 'No content available.';
  const contentLines = doc.splitTextToSize(content, contentWidth);

  // Check if we need page breaks
  contentLines.forEach(line => {
    if (y > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5.5;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `HIVE COMMAND — Generated ${new Date().toLocaleDateString()} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `${sanitizeFilename(output.title || 'output')}.pdf`;
  doc.save(filename);
  return filename;
}

// ─── DOCX Export ──────────────────────────────

export async function exportToDOCX(output) {
  const content = output.content || output.preview || 'No content available.';
  const paragraphs = content.split('\n').filter(Boolean);

  const doc = new Document({
    creator: 'HIVE COMMAND',
    title: output.title || 'Untitled Output',
    description: `Output from ${output.agent || output.agentId || 'Unknown Agent'}`,
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          children: [
            new TextRun({
              text: 'HIVE COMMAND',
              bold: true,
              size: 20,
              color: 'FFB800',
              font: 'Helvetica',
            }),
            new TextRun({
              text: '  |  AI Agent Swarm Operations Dashboard',
              size: 16,
              color: '9CA3AF',
              font: 'Helvetica',
            }),
          ],
          spacing: { after: 200 },
        }),

        // Separator
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFB800' },
          },
          spacing: { after: 300 },
        }),

        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: output.title || 'Untitled Output',
              bold: true,
              size: 32,
              color: '1A1A1A',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),

        // Meta info
        new Paragraph({
          children: [
            new TextRun({ text: 'Agent: ', bold: true, size: 18, color: '6B7280' }),
            new TextRun({ text: output.agent || output.agentId || 'Unknown', size: 18, color: '374151' }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Venture: ', bold: true, size: 18, color: '6B7280' }),
            new TextRun({ text: output.venture || 'N/A', size: 18, color: '374151' }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Type: ', bold: true, size: 18, color: '6B7280' }),
            new TextRun({ text: (output.type || 'document').toUpperCase(), size: 18, color: '374151' }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Status: ', bold: true, size: 18, color: '6B7280' }),
            new TextRun({ text: (output.status || '').replace('_', ' ').toUpperCase(), size: 18, color: '374151' }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Created: ', bold: true, size: 18, color: '6B7280' }),
            new TextRun({ text: formatDate(output.created || output.createdAt), size: 18, color: '374151' }),
          ],
          spacing: { after: 300 },
        }),

        // Separator
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
          },
          spacing: { after: 300 },
        }),

        // Content paragraphs
        ...paragraphs.map(p => new Paragraph({
          children: [
            new TextRun({
              text: p,
              size: 22,
              color: '1F2937',
              font: 'Calibri',
            }),
          ],
          spacing: { after: 160, line: 320 },
        })),

        // Footer
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated by HIVE COMMAND on ${new Date().toLocaleDateString()}`,
              size: 14,
              color: '9CA3AF',
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(output.title || 'output')}.docx`;
  saveAs(blob, filename);
  return filename;
}

// ─── Email Export ─────────────────────────────

export function exportViaEmail(output) {
  const subject = encodeURIComponent(`[HIVE COMMAND] ${output.title || 'Output'}`);
  const content = output.content || output.preview || 'No content available.';
  const venture = output.venture ? ` (${output.venture})` : '';

  const body = encodeURIComponent(
`${output.title || 'Untitled Output'}
${'='.repeat(40)}

Agent: ${output.agent || output.agentId || 'Unknown'}
Venture: ${output.venture || 'N/A'}${venture}
Type: ${(output.type || 'document').toUpperCase()}
Status: ${(output.status || '').replace('_', ' ').toUpperCase()}
Created: ${formatDate(output.created || output.createdAt)}
${output.url ? `URL: ${output.url}` : ''}

${'─'.repeat(40)}

${content}

${'─'.repeat(40)}
Sent from HIVE COMMAND — AI Agent Swarm Operations Dashboard`
  );

  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}
