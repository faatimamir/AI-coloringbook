
// This assumes jsPDF is loaded from a CDN and available on the window object.
declare const jspdf: any;

export const createColoringBookPdf = async (
  coverImage: string,
  pages: string[],
  theme: string,
  name: string
): Promise<string> => {
  return new Promise((resolve) => {
    const { jsPDF } = jspdf;
    // Create a new PDF in Portrait, with inches as units, on letter-sized paper
    const doc = new jsPDF('p', 'in', 'letter');
    const allImages = [coverImage, ...pages];
    
    // Standard letter size is 8.5x11 inches. We'll leave a margin.
    const margin = 0.5; // 0.5 inches
    const pageWidth = 8.5;
    const pageHeight = 11;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);

    allImages.forEach((imgData, index) => {
      if (index > 0) {
        doc.addPage();
      }
      // Add image, maintaining aspect ratio within the usable area
      doc.addImage(imgData, 'PNG', margin, margin, usableWidth, usableHeight);
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    resolve(pdfUrl);
  });
};
