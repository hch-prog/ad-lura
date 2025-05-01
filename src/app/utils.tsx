interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * Converts a data URL to a File object
 * @param {string} dataURL - The data URL to convert
 * @param {string} filename - The name for the generated file
 * @returns {File} - The generated File object
 */
export const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
};

/**
 * Creates a transparent PNG mask with specified dimensions
 * @param {number} width - The width of the mask
 * @param {number} height - The height of the mask
 * @returns {Promise<string>} - Promise that resolves to mask data URL
 */
export const createEmptyMask = (width: number, height: number): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Create a fully black PNG mask (black means unmasked areas in OpenAI inpainting)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        resolve(canvas.toDataURL('image/png'));
    });
};

/**
 * Gets image dimensions from a File object
 * @param {File} imageFile - The image file
 * @returns {Promise<{width: number, height: number}>} - Promise with dimensions
 */
export const getImageDimensions = (imageFile: File): Promise<ImageDimensions> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height
            });
        };
        img.src = URL.createObjectURL(imageFile);
    });
};