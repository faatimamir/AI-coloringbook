
// This assumes jsPDF is loaded from a CDN and available on the window object.
declare const jspdf: any;
// This assumes JSZip is loaded from a CDN and available on the window object.
declare const JSZip: any;

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

export const createStickerSheetPdf = async (
  stickers: string[]
): Promise<string> => {
  return new Promise((resolve) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'in', 'letter');
    
    const margin = 0.5;
    const stickerSize = 2.5; // Approx size for each sticker
    const stickersPerRow = 3;
    const xPositions = [margin, margin + stickerSize, margin + (stickerSize * 2)];
    let currentXIndex = 0;
    let currentY = margin;

    stickers.forEach((imgData) => {
      if (currentXIndex >= stickersPerRow) {
        currentXIndex = 0;
        currentY += stickerSize;
      }
      if (currentY + stickerSize > 11 - margin) {
        // We'd need to add a new page if there were more stickers
        // For now, assume they fit on one page.
        return; 
      }
      
      doc.addImage(imgData, 'PNG', xPositions[currentXIndex], currentY, stickerSize, stickerSize);
      currentXIndex++;
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    resolve(pdfUrl);
  });
};


export const createStickersZip = async (stickers: string[]): Promise<void> => {
    const zip = new JSZip();
    
    // Asynchronously fetch and add each sticker to the zip
    const promises = stickers.map(async (stickerDataUrl, index) => {
        // Fetch the base64 data as a blob
        const response = await fetch(stickerDataUrl);
        const blob = await response.blob();
        zip.file(`sticker-${index + 1}.png`, blob);
    });
    
    // Wait for all files to be added
    await Promise.all(promises);
    
    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stickers.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const createStoryPdf = async (
    storyText: string,
    storySelection: string,
    characters: { character1Name: string; character2Name?: string, character3Name?: string }
): Promise<string> => {
    return new Promise((resolve) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF('p', 'in', 'letter');
        const margin = 0.75;
        const pageWidth = 8.5;
        const pageHeight = 11;
        const maxWidth = pageWidth - (margin * 2);
        const storyTitles: {[key:string]: string} = {
            cinderella: 'Cinderella',
            snow_white: 'Snow White',
            jack_beanstalk: 'Jack and the Beanstalk'
        }

        const addPageDecorations = () => {
            doc.setDrawColor(200, 200, 255); // A light purple
            doc.setLineWidth(0.02);
            doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);
        };
        
        // --- Title Page ---
        addPageDecorations();
        doc.setFont('times', 'bold');
        doc.setFontSize(32);
        doc.setTextColor(88, 86, 214); // A nice purple
        doc.text(storyTitles[storySelection] || 'A Magical Story', pageWidth / 2, 4, { align: 'center' });
        
        doc.setFont('times', 'normal');
        doc.setFontSize(16);
        doc.setTextColor(100, 100, 100);
        let starringText = `Starring ${characters.character1Name}`;
        if (characters.character2Name) starringText += ` and ${characters.character2Name}`;
        if (characters.character3Name) starringText += ` with ${characters.character3Name}`;
        doc.text(starringText, pageWidth / 2, 5, { align: 'center' });
        
        // --- Story Pages ---
        doc.addPage();
        addPageDecorations();
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);

        const lines = doc.splitTextToSize(storyText, maxWidth);
        let cursorY = margin;
        const lineHeight = 1.2 * (12 / 72); // 1.2 line spacing for 12pt font

        lines.forEach((line: string) => {
            if (cursorY + lineHeight > pageHeight - margin) {
                doc.addPage();
                addPageDecorations();
                cursorY = margin;
            }
            doc.text(line, margin, cursorY);
            cursorY += lineHeight;
        });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        resolve(pdfUrl);
    });
};
