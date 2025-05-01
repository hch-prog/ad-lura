import { NextRequest, NextResponse } from "next/server";
import fs from "fs"; // Import the fs module
import { OpenAI, toFile } from "openai"; // Import OpenAI and toFile helper
import path from "path";

// Initialize OpenAI instance
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key from .env
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const prompt = formData.get("prompt") as string;
        const imageFiles = formData.getAll("images") as File[];

        // Retrieve the additional parameters (quality, size, and style)
        const quality = formData.get("quality") as string || "auto";  // Default to "auto"
        const size = formData.get("size") as string || "auto";        // Default to "auto"
        //const style = formData.get("style") as string || "vivid";      // Default to "vivid"

        // Validate prompt and images
        if (!prompt || imageFiles.length === 0) {
            return NextResponse.json({ error: "Prompt and at least one image are required" }, { status: 400 });
        }

        if (imageFiles.length > 4) {
            return NextResponse.json({ error: "You can upload up to 4 images only" }, { status: 400 });
        }

        // Map quality and size to the allowed values expected by OpenAI API
        const validQualityValues: ("auto" | "standard" | "low" | "medium" | "high" | null)[] = ["auto", "standard", "low", "medium", "high", null];
        const validSizeValues: ("256x256" | "512x512" | "1024x1024" | null)[] = ["256x256", "512x512", "1024x1024", null];

        const mappedQuality: "auto" | "standard" | "low" | "medium" | "high" | null = validQualityValues.includes(quality as any) ? (quality as any) : "auto";
        const mappedSize: "256x256" | "512x512" | "1024x1024" | null = validSizeValues.includes(size as any) ? (size as any) : "auto";

        // Convert images into the correct format for OpenAI API using toFile
        const images = await Promise.all(
            imageFiles.map(async (file) => {
                const buffer = await file.arrayBuffer();
                return toFile(Buffer.from(buffer), file.name, { type: file.type });
            })
        );

        // Prepare the OpenAI image edit request
        const response = await client.images.edit({
            model: "gpt-image-1",   // Use the GPT image generation model
            image: images,          // The images to edit (uploaded images)
            prompt: prompt,         // The prompt for the image edit
            n: 1,                   // Generate only one image
            response_format: "b64_json", // Response will be base64 encoded image
            quality: mappedQuality, // Send the mapped quality value to the API
            size: mappedSize,       // Send the mapped size value to the API
            //style: style,           // Send the selected style to the API (for DALL-E 3)
        });

        // Log the entire response for debugging
        console.log("OpenAI Response:", response);
        // Save OpenAI response to a text file for debugging
        const timestamp = Date.now();
        const responseFilePath = path.join(process.cwd(), 'public', 'logs', `openai_response_${timestamp}.txt`);

        // Create 'logs' directory if it doesn't exist
        const logsDir = path.dirname(responseFilePath);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Save response as JSON to the file
        fs.writeFileSync(responseFilePath, JSON.stringify(response, null, 2));

        console.log("OpenAI response saved to file:", responseFilePath);

        // Handle OpenAI API response
        if (!response || !response.data || !response.data[0]?.b64_json) {
            return NextResponse.json({ error: "No image generated" }, { status: 500 });
        }

        // Get the base64 image from response
        const imageBase64 = response.data[0].b64_json;

        // Convert base64 to buffer and save the file to the server
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const outputPath = "public/uploads/generated-image.png"; // Path to save the generated image

        // Make sure the uploads directory exists
        const uploadsDir = "public/uploads";
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save the image to the output path
        fs.writeFileSync(outputPath, imageBuffer);

        // Return the image path for frontend to use
        return NextResponse.json({
            imagePath: `/uploads/generated-image.png`,
            success: true,
            response: response,
            responseFile: `/logs/openai_response_${timestamp}.txt`, // Return the path to the response file
        });

    } catch (error) {
        console.error("Error in /api/edit-image:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
