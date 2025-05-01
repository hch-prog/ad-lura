"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>("");
  const [size, setSize] = useState<string>("auto");
  const [quality, setQuality] = useState<string>("auto");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, size, quality }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.imagePath);
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
                Describe your image
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A children's book drawing of a veterinarian using a stethoscope to listen to the heartbeat of a baby otter."
                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full min-h-[120px] text-gray-800"
                required
              />
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <label htmlFor="size" className="block font-medium text-gray-700 text-lg">
                Select Image Size
              </label>
              <select
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full text-gray-800"
              >
                <option value="auto">Auto</option>
                <option value="1024x1024">1024x1024 (Square)</option>
                <option value="1536x1024">1536x1024 (Landscape)</option>
                <option value="1024x1536">1024x1536 (Portrait)</option>
              </select>
            </div>

            {/* Quality Selector */}
            <div className="space-y-2">
              <label htmlFor="quality" className="block font-medium text-gray-700 text-lg">
                Select Image Quality
              </label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-purple-400 w-full text-gray-800"
              >
                <option value="auto">Auto</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white ${isLoading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 transition-colors shadow-md"
                }`}
            >
              {isLoading ? "Generating..." : "Generate Image"}
            </button>
          </form>
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
              <div className="relative w-full h-[400px] aspect-h-1 aspect-w-1">
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
