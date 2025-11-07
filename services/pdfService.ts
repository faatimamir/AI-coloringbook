
import type { StorybookContent } from '../types.ts';

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
    
    const promises = stickers.map(async (stickerDataUrl, index) => {
        const response = await fetch(stickerDataUrl);
        const blob = await response.blob();
        zip.file(`sticker-${index + 1}.png`, blob);
    });
    
    await Promise.all(promises);
    
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
    storybook: StorybookContent
): Promise<string> => {
    return new Promise((resolve) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF('p', 'in', 'letter');
        const margin = 0.75;
        const pageWidth = 8.5;
        const pageHeight = 11;
        const maxWidth = pageWidth - (margin * 2);
        
        // --- Cover Page ---
        doc.addImage(storybook.coverImage, 'PNG', 0, 0, pageWidth, pageHeight);
        doc.setFont('times', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(255, 255, 255);
        // Add a subtle shadow/outline to make text readable on any image
        doc.text(storybook.title, pageWidth / 2, 4, { align: 'center' }, null, null, { textShadow: '2px 2px 5px black' });
        
        doc.setFont('times', 'normal');
        doc.setFontSize(18);
        let starringText = `Starring ${storybook.characters.character1Name}`;
        if (storybook.characters.character2Name) starringText += ` and ${storybook.characters.character2Name}`;
        doc.text(starringText, pageWidth / 2, 4.8, { align: 'center' });

        // --- Story Pages ---
        const paragraphs = storybook.text.split('\n\n');
        const illustrations = [...storybook.illustrations];
        // Distribute illustrations throughout the story
        const illustrationPlacement = [1, 3, 5]; 

        let cursorY = margin;
        const lineHeight = 1.4 * (12 / 72);
        
        const addNewPage = () => {
            doc.addPage();
            doc.setFillColor(253, 245, 230); // Parchment color: #FDF5E6
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            cursorY = margin;
        };

        addNewPage(); // Start with the first story page

        paragraphs.forEach((paragraph, index) => {
            doc.setFont('times', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(30, 30, 30);
            
            const lines = doc.splitTextToSize(paragraph, maxWidth);
            
            // Check if the whole paragraph fits
            if (cursorY + (lines.length * lineHeight) > pageHeight - margin) {
                addNewPage();
            }

            lines.forEach((line: string) => {
                doc.text(line, margin, cursorY);
                cursorY += lineHeight;
            });
            
            cursorY += lineHeight; // Add extra space after paragraph

            // Check if we should place an illustration here
            if (illustrationPlacement.includes(index) && illustrations.length > 0) {
                const imgData = illustrations.shift();
                const imgHeight = 3.5; // Illustrations will be 3.5 inches tall
                cursorY += 0.25; // Space before image
                
                if (cursorY + imgHeight > pageHeight - margin) {
                    addNewPage();
                }
                
                if (imgData) {
                    doc.addImage(imgData, 'PNG', margin, cursorY, maxWidth, imgHeight);
                    cursorY += imgHeight + 0.25; // Space after image
                }
            }
        });

        const pdfBlob = doc.output('blob');
        // FIX: The variable `pdfUrl` was incorrectly used here instead of `pdfBlob`, causing a reference error.
        const pdfUrl = URL.createObjectURL(pdfBlob);
        resolve(pdfUrl);
    });
};