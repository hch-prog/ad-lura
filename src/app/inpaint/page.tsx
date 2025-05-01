"use client"; // Add this at the top to enable client-side features

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { dataURLtoFile } from "../utils";
import ImageMaskEditor from "./ImageMaskEditor"; // Import the ImageMaskEditor component

export default function ImageInpainting() {
    const [prompt, setPrompt] = useState<string>("A sunlit indoor lounge area with a pool containing a flamingo");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [maskFile, setMaskFile] = useState<File | null>(null);
    const [showMaskEditor, setShowMaskEditor] = useState<boolean>(false);
    const [maskImage, setMaskImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [maskMode, setMaskMode] = useState<"draw" | "upload">("draw");
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // Reset error when user changes inputs
    useEffect(() => {
        if (error) setError(null);
    }, [imageFile, maskFile, prompt, maskMode]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setError("Please upload a valid image file");
                return;
            }

            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));

            // Reset mask when a new image is uploaded
            setMaskFile(null);
            setMaskImage(null);

            // Show mask editor if in draw mode
            if (maskMode === "draw") {
                setShowMaskEditor(true);
            }
        }
    };

    const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setError("Please upload a valid image file for the mask");
                return;
            }

            setMaskFile(file);

            // Create a data URL for preview
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result) {
                    setMaskImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMaskGenerated = (maskDataURL: string) => {
        // Convert data URL to File object
        const file = dataURLtoFile(maskDataURL, "mask.png");
        setMaskFile(file);
        setMaskImage(maskDataURL);
        setShowMaskEditor(false);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!imageFile || !maskFile) {
            setError("Both image and mask are required");
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("mask", maskFile);
        formData.append("prompt", prompt);

        try {
            const response = await fetch("/api/inpaint-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate image");
            }

            setGeneratedImage(data.imagePath);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
            console.error("Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="bg-gradient-to-b from-blue-50 to-purple-50 p-4 md:p-8 lg:p-16 min-h-screen">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-6 font-bold text-purple-800 text-3xl md:text-4xl text-center">
                    AI Image Inpainting (Edit with Mask)
                </h1>

                <div className="bg-white shadow-lg mb-8 p-6 rounded-xl">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="prompt" className="block font-medium text-gray-700 text-lg">
                                Describe the image edit
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A sunlit indoor lounge area with a pool containing a flamingo"
                                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full min-h-[120px] text-gray-800"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="image" className="block font-medium text-gray-700 text-lg">
                                Upload Image (to be edited)
                            </label>
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                                required
                            />

                            {imagePreviewUrl && (
                                <div className="relative mt-2 p-2 border border-gray-200 rounded-lg">
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={imagePreviewUrl}
                                            alt="Source image"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block font-medium text-gray-700 text-lg">
                                Mask (define edit area)
                            </label>

                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setMaskMode("upload")}
                                    className={`flex-1 px-4 py-3 rounded-lg transition-colors ${maskMode === "upload"
                                        ? "bg-purple-600 text-white font-medium shadow-md"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    Upload Mask
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMaskMode("draw");
                                        if (imageFile) {
                                            setShowMaskEditor(true);
                                        } else {
                                            setError("Please upload an image first");
                                        }
                                    }}
                                    className={`flex-1 px-4 py-3 rounded-lg transition-colors ${maskMode === "draw"
                                        ? "bg-purple-600 text-white font-medium shadow-md"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    Draw Mask
                                </button>
                            </div>

                            {maskMode === "upload" && (
                                <div>
                                    <input
                                        type="file"
                                        id="mask"
                                        accept="image/*"
                                        onChange={handleMaskChange}
                                        className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                                        required={maskMode === "upload"}
                                    />

                                    {maskImage && maskMode === "upload" && (
                                        <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                                            <div className="relative w-full h-48">
                                                <Image
                                                    src={maskImage}
                                                    alt="Mask image"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {maskMode === "draw" && imageFile && !showMaskEditor && maskImage && (
                                <div className="mt-2">
                                    <div className="p-2 border border-gray-200 rounded-lg">
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={maskImage}
                                                alt="Generated mask"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowMaskEditor(true)}
                                        className="bg-blue-500 hover:bg-blue-600 mt-2 px-4 py-2 rounded-lg text-white"
                                    >
                                        Edit Mask
                                    </button>
                                </div>
                            )}

                            {maskMode === "draw" && imageFile && showMaskEditor && (
                                <div className="mt-2">
                                    <ImageMaskEditor
                                        sourceImage={imageFile}
                                        onMaskGenerated={handleMaskGenerated}
                                        initialMask={maskImage}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !imageFile || !maskFile}
                            className={`w-full py-3 px-6 rounded-lg font-medium text-white ${isLoading || !imageFile || !maskFile
                                ? "bg-purple-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 transition-colors shadow-md"
                                }`}
                        >
                            {isLoading ? "Generating..." : "Generate Image"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 mb-8 p-4 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col justify-center items-center bg-white shadow-lg p-8 rounded-xl">
                        <div className="mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full w-12 h-12 animate-spin"></div>
                        <p className="text-gray-600">Creating your masterpiece...</p>
                    </div>
                )}

                {generatedImage && !isLoading && (
                    <div className="bg-white shadow-lg p-6 rounded-xl">
                        <h2 className="mb-4 font-semibold text-gray-800 text-xl">Generated Image</h2>
                        <div className="relative shadow-md border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative w-full h-[400px]">
                                <Image
                                    src={generatedImage}
                                    alt="Generated image"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <a
                                href={generatedImage}
                                download
                                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium text-gray-800 transition-colors"
                            >
                                Download Image
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}