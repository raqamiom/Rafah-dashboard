import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoImageUrl from '../assets/appLogo.png';

/**
 * Converts an image URL to base64
 * @param {string} imageUrl - URL to the image file
 * @returns {Promise<string|null>} Base64 encoded image or null
 */
const imageToBase64 = (imageUrl) => {
  return new Promise((resolve) => {
    // If it's already a base64 string, return it
    if (imageUrl && imageUrl.startsWith('data:')) {
      resolve(imageUrl);
      return;
    }

    if (!imageUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        console.warn('Error converting image to base64:', error);
        resolve(null);
      }
    };
    img.onerror = (error) => {
      console.warn('Error loading image, continuing without logo:', error);
      resolve(null);
    };
    img.src = imageUrl;
  });
};

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generates a PDF contract document
 * @param {Object} contract - Contract data
 * @param {Object} student - Student details
 * @param {Array} rooms - Room details array
 * @returns {Promise<void>}
 */
export const generateContractPDF = async (contract, student, rooms = []) => {
  try {
    // Create new PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Load and add logo to PDF
    const logoBase64 = await imageToBase64(logoImageUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 15, 15, 30, 15);
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    }

    // Header Section
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRACT AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contract ID: ${contract.contractId || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 5;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;

    // Student Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const studentData = [
      ['Name:', student?.name || contract?.studentName || 'N/A'],
      ['Email:', student?.email || 'N/A'],
      ['Phone:', student?.phone || 'N/A'],
      ['ID Number:', student?.idNumber || contract?.IDnumber || 'N/A'],
      ['Emergency Contact Name:', student?.emergencyContactName || 'N/A'],
      ['Emergency Contact Phone:', student?.emergencyContactPhone || 'N/A'],
      ['Status:', student?.status || 'N/A']
    ];

    doc.autoTable({
      startY: yPosition,
      head: false,
      body: studentData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Room Information Section
    if (rooms && rooms.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ROOM INFORMATION', 15, yPosition);
      yPosition += 8;

      // Create room details table
      const roomTableData = rooms.map((room, index) => [
        index + 1,
        room.roomNumber || 'N/A',
        room.type || 'N/A',
        room.capacity || 'N/A',
        room.building || 'N/A',
        room.floor || 'N/A',
        room.rentAmount ? `${room.rentAmount} OMR` : 'N/A'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['#', 'Room Number', 'Type', 'Capacity', 'Building', 'Floor', 'Rent Amount']],
        body: roomTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Contract Terms Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRACT TERMS', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const contractData = [
      ['Contract ID:', contract.contractId || 'N/A'],
      ['Start Date:', formatDate(contract.startDate)],
      ['End Date:', formatDate(contract.endDate)],
      ['Status:', contract.status ? contract.status.toUpperCase() : 'N/A'],
      ['Is Discounted:', contract.isDiscounted ? 'Yes' : 'No']
    ];

    if (contract.isDiscounted) {
      contractData.push(['Discounted Amount:', contract.discountedAmount ? `${contract.discountedAmount} OMR` : 'N/A']);
      if (contract.discountPeriod) {
        contractData.push(['Discount Period:', contract.discountPeriod]);
      }
    }

    doc.autoTable({
      startY: yPosition,
      head: false,
      body: contractData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Terms and Conditions Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS AND CONDITIONS', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const terms = [
      '1. The student agrees to abide by all rules and regulations of the facility.',
      '2. Rent payments must be made on time as specified in the contract.',
      '3. The student is responsible for maintaining the room in good condition.',
      '4. Any damages beyond normal wear and tear will be charged to the student.',
      '5. The contract may be terminated according to the terms specified herein.',
      '6. All personal belongings must be removed upon contract termination.',
      '7. The facility reserves the right to inspect the room with reasonable notice.'
    ];

    terms.forEach((term, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(term, 15, yPosition, { maxWidth: pageWidth - 30 });
      yPosition += 6;
    });

    yPosition += 10;

    // Signature Section
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', 15, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Student signature line
    doc.text('Student Signature:', 15, yPosition);
    doc.line(15, yPosition + 3, 90, yPosition + 3);
    yPosition += 10;
    doc.text(`Name: ${student?.name || contract?.studentName || 'N/A'}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, yPosition);

    yPosition += 15;

    // Facility signature line
    doc.text('Facility Representative Signature:', 15, yPosition);
    doc.line(15, yPosition + 3, 90, yPosition + 3);
    yPosition += 10;
    doc.text('Name: _________________________', 15, yPosition);
    yPosition += 5;
    doc.text('Date: _________________________', 15, yPosition);

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Page ${i} of ${totalPages} - This is a computer-generated document`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const fileName = `Contract_${contract.contractId || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save the PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

