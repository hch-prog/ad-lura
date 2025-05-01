"use client";

import { useState } from "react";
import Image from "next/image";

// Typing for the component
export default function ImageGenerator() {
    const [prompt, setPrompt] = useState<string>("Create a lovely gift basket with these four items in it.");
    const [images, setImages] = useState<File[]>([]);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Additional parameters
    const [quality, setQuality] = useState<string>("auto");
    const [size, setSize] = useState<string>("auto");
    const [style, setStyle] = useState<string>("vivid");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setImages(Array.from(files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        images.forEach((image) => {
            formData.append("images", image);
        });

        formData.append("prompt", prompt);
        formData.append("quality", quality);
        formData.append("size", size);
        formData.append("style", style);

        try {
            const response = await fetch("/api/edit-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate image");
            }

            setGeneratedImage(data.imagePath);
            console.log("Complete API Response:", data.response); // Log the full response
        } catch (err: unknown) {
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
                    AI Image Generator
                </h1>

                <div className="bg-white shadow-lg mb-8 p-6 rounded-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="prompt" className="block font-medium text-gray-700 text-lg">
                                Describe the image
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Create a lovely gift basket with these four items in it."
                                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full min-h-[120px] text-gray-800"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="images" className="block font-medium text-gray-700 text-lg">
                                Upload images (up to 4)
                            </label>
                            <input
                                type="file"
                                id="images"
                                accept="image/png"
                                multiple
                                onChange={handleImageChange}
                                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                            />
                            <p className="mt-2 text-gray-600">You can upload up to 4 images.</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="quality" className="block font-medium text-gray-700 text-lg">
                                Image Quality
                            </label>
                            <select
                                id="quality"
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                            >
                                <option value="auto">Auto</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="size" className="block font-medium text-gray-700 text-lg">
                                Image Size
                            </label>
                            <select
                                id="size"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                            >
                                <option value="auto">Auto</option>
                                <option value="1024x1024">1024x1024</option>
                                <option value="1536x1024">1536x1024</option>
                                <option value="1024x1536">1024x1536</option>
                            </select>
                        </div>

                        {/* <div className="space-y-2">
                            <label htmlFor="style" className="block font-medium text-gray-700 text-lg">
                                Image Style (For DALL-E 3 only)
                            </label>
                            <select
                                id="style"
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 w-full"
                            >
                                <option value="vivid">Vivid</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div> */}

                        <button
                            type="submit"
                            disabled={isLoading || images.length === 0}
                            className={`w-full py-3 px-6 rounded-lg font-medium text-white ${isLoading
                                ? "bg-purple-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 transition-colors shadow-md"
                                }`}
                        >
                            {isLoading ? "Generating..." : "Generate Image"}
                        </button>
                    </form>

                    {error && <p className="mt-4 text-red-500">{error}</p>}

                    {generatedImage && (
                        <div className="mt-8">
                            <h2 className="mb-4 font-semibold text-purple-800 text-xl text-center">Generated Image</h2>
                            <Image
                                src={generatedImage}
                                alt="Generated Image"
                                width={1024}
                                height={1024}
                                className="mx-auto rounded-lg"
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
