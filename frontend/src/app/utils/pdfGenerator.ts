import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colores Verde Predominante
const COLORS = {
  primary: [16, 185, 129] as const, // Verde esmeralda #10b981
  secondary: [6, 78, 59] as const, // Verde oscuro #064e3b
  accent: [52, 211, 153] as const, // Verde brillante #34d399
  background: [10, 20, 16] as const, // Verde muy oscuro #0a1410
  text: [232, 245, 233] as const, // Texto claro #e8f5e9
  textDark: [40, 40, 40] as const,
  gold: [212, 175, 55] as const, // Dorado sutil (muy poco uso)
} as const;

interface PDFGarzonData {
  nombreGarzon: string;
  fecha: string;
  totalVentas: number;
  comision: number;
  detalles: {
    producto: string;
    cantidad: number;
    chicas: string;
    total: number;
  }[];
}

interface PDFChicaData {
  nombreArtistico: string;
  fecha: string;
  detalles: {
    producto: string;
    cantidad: number;
    participantes: number;
    fraccion: number;
    ganancia: number;
    estado: string;
  }[];
  totalFinal: number;
}

export function generarPDFGarzon(data: PDFGarzonData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header - Fondo Verde
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo/Título
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.text('CLUB PRIVADO', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('Reporte de Liquidación - Garzón', pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text('Documento Confidencial • Uso Interno', pageWidth / 2, 30, { align: 'center' });

  // Reset color
  doc.setTextColor(...COLORS.textDark);

  // Información del Garzón
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Garzón', 15, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${data.nombreGarzon}`, 15, 52);
  doc.text(`Fecha: ${data.fecha}`, 15, 58);

  // Resumen con fondo verde
  const resumeY = 65;
  doc.setFillColor(...COLORS.primary, 0.1);
  doc.roundedRect(15, resumeY, pageWidth - 30, 20, 3, 3, 'F');

  doc.setFontSize(10);
  doc.text('Total Ventas:', 20, resumeY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(formatCurrency(data.totalVentas), 60, resumeY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Comisión (10%):', 20, resumeY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text(formatCurrency(data.comision), 60, resumeY + 15);

  doc.setTextColor(...COLORS.textDark);
  doc.setFont('helvetica', 'normal');

  // Detalle de Ventas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Ventas', 15, 95);
  doc.setFont('helvetica', 'normal');

  const tableData = data.detalles.map(item => [
    item.producto,
    item.cantidad.toString(),
    item.chicas,
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Producto', 'Cant.', 'Chicas/Modo', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.secondary as any,
      textColor: COLORS.text as any,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.textDark as any,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 247],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 60 },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  // Total Final
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, finalY + 5, pageWidth - 30, 12, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 20, finalY + 13);
  doc.text(formatCurrency(data.totalVentas), pageWidth - 20, finalY + 13, { align: 'right' });

  // Footer
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerY = pageHeight - 25;

  // Línea de firma
  doc.setDrawColor(...COLORS.secondary);
  doc.line(15, footerY - 10, 80, footerY - 10);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Firma Recibido', 15, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento confidencial - Uso interno exclusivo', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, pageWidth / 2, footerY + 10, { align: 'center' });

  // Descargar
  doc.save(`liquidacion_garzon_${data.nombreGarzon.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

export function generarPDFChica(data: PDFChicaData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.text('CLUB PRIVADO', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('Reporte de Fichas', pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text('Documento Confidencial • Uso Interno', pageWidth / 2, 30, { align: 'center' });

  doc.setTextColor(...COLORS.textDark);

  // Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información', 15, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre Artístico: ${data.nombreArtistico}`, 15, 52);
  doc.text(`Fecha: ${data.fecha}`, 15, 58);

  // Tabla
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Fichas', 15, 70);
  doc.setFont('helvetica', 'normal');

  const tableData = data.detalles.map(item => [
    item.producto,
    item.cantidad.toString(),
    item.participantes === 1 ? 'Sola' : `(${item.participantes})`,
    formatCurrency(item.ganancia),
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Producto', 'Cant.', 'Part.', 'Ganancia']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.secondary as any,
      textColor: COLORS.text as any,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.textDark as any,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 247],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, finalY + 5, pageWidth - 30, 12, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

const totalCalculado = data.detalles.reduce(
  (acc, item) => acc + Number(item.ganancia || 0),
  0
);

doc.setFillColor(...COLORS.primary);
doc.roundedRect(15, finalY + 5, pageWidth - 30, 12, 2, 2, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');

doc.text('TOTAL FICHAS:', 20, finalY + 13);
doc.text(formatCurrency(totalCalculado), pageWidth - 20, finalY + 13, { align: 'right' });

  // Footer
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  const footerY = pageHeight - 25;

  doc.setDrawColor(...COLORS.secondary);
  doc.line(15, footerY - 10, 80, footerY - 10);

  doc.text('Firma Recibido', 15, footerY - 5);
  doc.text(
    'Documento confidencial - Uso interno exclusivo',
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );

  doc.text(
    `Generado: ${new Date().toLocaleString('es-CL')}`,
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );

  doc.save(`fichas_${data.nombreArtistico.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
}

// Mantener función legacy para compatibilidad
export interface PDFData {
  tipo: 'garzon' | 'personal';
  nombre: string;
  fecha: string;
  datos: {
    concepto: string;
    cantidad: string | number;
    monto?: string | number;
  }[];
  totalGeneral: string | number;
}

export function generatePDF(data: PDFData) {
  if (data.tipo === 'garzon') {
    generarPDFGarzon({
      nombreGarzon: data.nombre,
      fecha: data.fecha,
      totalVentas: typeof data.totalGeneral === 'number' ? data.totalGeneral : 0,
      comision: typeof data.totalGeneral === 'number' ? data.totalGeneral * 0.1 : 0,
      detalles: data.datos.map(d => ({
        producto: d.concepto,
        cantidad: typeof d.cantidad === 'number' ? d.cantidad : 1,
        chicas: 'N/A',
        total: typeof d.monto === 'number' ? d.monto : 0,
      })),
    });
  } else {
    generarPDFChica({
      nombreArtistico: data.nombre,
      fecha: data.fecha,
      detalles: data.datos.map((d: any) => ({
        producto: d.concepto,
        cantidad: d.cantidad,
        participantes: d.participantes,
        fraccion: d.fraccion,
        ganancia: d.monto,
        estado: d.estado || 'Activo',
      })),
      totalFinal: Number(data.totalGeneral),
    });
  }
}
