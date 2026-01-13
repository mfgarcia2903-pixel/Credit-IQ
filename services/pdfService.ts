
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdf = async (element: HTMLElement, fileName: string) => {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        
        // If the content is longer than one page, split it
        let heightLeft = canvasHeight;
        let position = 0;
        const pageHeightInCanvas = (pdfHeight * canvasWidth) / pdfWidth;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, (canvasHeight * imgWidth)/canvasWidth);
        heightLeft -= pageHeightInCanvas;
        
        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, (canvasHeight * imgWidth)/canvasWidth);
            heightLeft -= pageHeightInCanvas;
        }

        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
    }
};
