import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) { // Explicitly typing 'request'
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Generate the image
        const result = await openai.images.generate({
            model: "gpt-image-1", // Use the appropriate model
            prompt,               // Include the prompt as per OpenAI documentation
        });

        // Check if result.data is defined and has the expected structure
        if (!result.data || result.data.length === 0) {
            return NextResponse.json(
                { error: "Failed to generate image data" },
                { status: 500 }
            );
        }

        // Get the base64 data from the result (assuming the result contains base64)
        const image_base64 = result.data[0]?.b64_json;

        if (!image_base64) {
            return NextResponse.json(
                { error: "Image base64 data is missing" },
                { status: 500 }
            );
        }

        // Generate a unique filename
        const filename = `${uuidv4()}.png`;

        // Ensure the public/images directory exists
        const imageDir = path.join(process.cwd(), "public/images");
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        // Save the image to the public directory
        const filePath = path.join(imageDir, filename);
        const image_bytes = Buffer.from(image_base64, "base64");
        fs.writeFileSync(filePath, image_bytes);

        // Return the path to the saved image
        return NextResponse.json({
            success: true,
            imagePath: `/images/${filename}`,
        });
    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
