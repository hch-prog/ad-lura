import { useRef, useState, useEffect } from "react";
import MaskInstructions from "./MaskInstructions";
import { getImageDimensions, createEmptyMask } from "../utils";

// Define interfaces for props and canvas context
interface ImageMaskEditorProps {
    sourceImage: File;
    onMaskGenerated: (maskDataURL: string) => void;
    brushSize?: number;
    initialMask?: string | null;
}

interface CanvasSize {
    width: number;
    height: number;
}

interface Position {
    x: number;
    y: number;
}

interface ImageDimensions {
    width: number;
    height: number;
}

export default function ImageMaskEditor({
    sourceImage,
    onMaskGenerated,
    brushSize = 30,
    initialMask = null
}: ImageMaskEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [sourceCtx, setSourceCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 600, height: 400 });
    const [currentBrushSize, setCurrentBrushSize] = useState<number>(brushSize);
    const [prevPos, setPrevPos] = useState<Position>({ x: 0, y: 0 });

    // Initialize canvas when component mounts
    useEffect(() => {
        if (canvasRef.current && sourceCanvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            const sourceContext = sourceCanvasRef.current.getContext('2d');

            if (context && sourceContext) {
                setCtx(context);
                setSourceCtx(sourceContext);

                // Clear mask canvas with black (unmasked area)
                context.fillStyle = 'black';
                context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                // If there's an initial mask, load and draw it
                if (initialMask) {
                    const maskImg = new Image();
                    maskImg.onload = () => {
                        if (canvasRef.current && context) {
                            // Clear canvas first
                            context.fillStyle = 'black';
                            context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            
                            // Draw the mask
                            context.drawImage(maskImg, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                    };
                    maskImg.src = initialMask;
                }
            }
        }
    }, [initialMask, canvasSize]); // Add canvasSize to dependencies

    // Load source image when it changes
    useEffect(() => {
        let imageUrl: string;
        
        const loadImage = async () => {
            if (!sourceImage || !sourceCtx || !canvasRef.current) return;

            try {
                const dimensions = await getImageDimensions(sourceImage);
                const aspectRatio = dimensions.width / dimensions.height;
                let newWidth: number, newHeight: number;

                if (aspectRatio > 1) {
                    newWidth = Math.min(800, dimensions.width);
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = Math.min(600, dimensions.height);
                    newWidth = newHeight * aspectRatio;
                }

                setCanvasSize({ width: newWidth, height: newHeight });

                const img = new Image();
                imageUrl = URL.createObjectURL(sourceImage);
                
                img.onload = () => {
                    if (sourceCtx) {
                        sourceCtx.drawImage(img, 0, 0, newWidth, newHeight);
                    }
                };
                img.src = imageUrl;
            } catch (error) {
                console.error('Error loading image:', error);
            }
        };

        loadImage();

        // Cleanup function
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [sourceImage, sourceCtx]);

    useEffect(() => {
        return () => {
            // Cleanup
            if (sourceCanvasRef.current) {
                const context = sourceCanvasRef.current.getContext('2d');
                context?.clearRect(0, 0, sourceCanvasRef.current.width, sourceCanvasRef.current.height);
            }
            if (canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        };
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setPrevPos({ x: 0, y: 0 });
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        setPrevPos({ x: 0, y: 0 });
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !ctx || !canvasRef.current) return;

        try {
            const rect = canvasRef.current.getBoundingClientRect();
            const scaleX = canvasRef.current.width / rect.width;
            const scaleY = canvasRef.current.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const currentPos = { x, y };

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = currentBrushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw the circle at current position
            ctx.beginPath();
            ctx.arc(x, y, currentBrushSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Connect to previous position if exists
            if (prevPos.x !== 0 && prevPos.y !== 0) {
                ctx.beginPath();
                ctx.moveTo(prevPos.x, prevPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                ctx.stroke();
            }

            setPrevPos(currentPos);
        } catch (error) {
            console.error('Error drawing mask:', error);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);
        setPrevPos({ x: 0, y: 0 });
        handleTouch(e);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        handleTouch(e);
    };

    const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !ctx || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        const currentPos = { x, y };

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = currentBrushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.arc(x, y, currentBrushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        if (prevPos.x !== 0 && prevPos.y !== 0) {
            ctx.beginPath();
            ctx.moveTo(prevPos.x, prevPos.y);
            ctx.lineTo(currentPos.x, currentPos.y);
            ctx.stroke();
        }

        setPrevPos(currentPos);
    };

    const generateMask = () => {
        if (canvasRef.current) {
            const maskDataUrl = canvasRef.current.toDataURL('image/png');
            onMaskGenerated(maskDataUrl);
        }
    };

    const clearMask = () => {
        if (ctx && canvasRef.current) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentBrushSize(parseInt(e.target.value, 10));
    };

    return (
        <div className="flex flex-col bg-white shadow-md p-6 rounded-xl">
            <MaskInstructions />

            <div className="mb-4">
                <div className="flex justify-between items-center">
                    <label className="block font-medium text-gray-700">
                        Brush Size: {currentBrushSize}px
                    </label>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentBrushSize(Math.max(5, currentBrushSize - 5))}
                            className="flex justify-center items-center bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8"
                        >
                            -
                        </button>
                        <button
                            onClick={() => setCurrentBrushSize(Math.min(100, currentBrushSize + 5))}
                            className="flex justify-center items-center bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8"
                        >
                            +
                        </button>
                    </div>
                </div>
                <input
                    type="range"
                    min="5"
                    max="100"
                    value={currentBrushSize}
                    onChange={handleBrushSizeChange}
                    className="mt-2 w-full"
                />
            </div>

            <div className="relative mb-4 border border-gray-300 rounded-lg overflow-hidden" 
                 style={{ height: `${canvasSize.height}px` }}> {/* Add fixed height */}
                {/* Source image canvas (background) */}
                <canvas
                    ref={sourceCanvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="top-0 left-0 z-0 absolute"
                />

                {/* Mask drawing canvas (foreground) */}
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="top-0 left-0 z-10 absolute opacity-50"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                    style={{ cursor: 'crosshair', touchAction: 'none' }}
                />
            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    type="button"
                    onClick={clearMask}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium text-white transition-colors"
                >
                    Clear Mask
                </button>
                <button
                    type="button"
                    onClick={generateMask}
                    className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-medium text-white transition-colors"
                >
                    Use This Mask
                </button>
            </div>
        </div>
    );
}