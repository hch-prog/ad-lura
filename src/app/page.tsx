"use client";

import { useState } from "react";
import Image from "next/image";

// Typing for the component
export default function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => { // Explicitly typing 'e'
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.imagePath);
    } catch (err: unknown) { // Explicitly typing 'err'
      if (err instanceof Error) {
        setError(err.message); // Safely accessing message
      } else {
        setError("An unknown error occurred");
      }
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 md:p-8 lg:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-purple-800 mb-6">
          AI Image Generator
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-lg font-medium text-gray-700">
                Describe your image
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A children's book drawing of a veterinarian using a stethoscope to listen to the heartbeat of a baby otter."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent min-h-[120px] text-gray-800"
                required
              />
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg">
            <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-4"></div>
            <p className="text-gray-600">Creating your masterpiece...</p>
          </div>
        )}

        {generatedImage && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Image</h2>
            <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-md">
              <div className="aspect-w-1 aspect-h-1 relative w-full h-[400px]">
                <Image
                  src={generatedImage}
                  alt="Generated image"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={generatedImage}
                download
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
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
