import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const prompt = formData.get("prompt")?.toString();
        const imageFile = formData.get("image") as Blob;
        const maskFile = formData.get("mask") as Blob;

        // Validate inputs
        if (!prompt || !imageFile || !maskFile) {
            return NextResponse.json(
                { error: "Prompt, image, and mask are required" },
                { status: 400 }
            );
        }

        // Ensure the files are valid images (could be expanded to check MIME types)
        const isImage = (file: Blob) => file.type.startsWith("image/");
        if (!isImage(imageFile) || !isImage(maskFile)) {
            return NextResponse.json(
                { error: "Invalid image file(s)" },
                { status: 400 }
            );
        }

        // Convert files to OpenAI format
        const imageFileConverted = await toFile(imageFile, "image.png");
        const maskFileConverted = await toFile(maskFile, "mask.png");

        // Send request to OpenAI API for image editing
        const response = await openai.images.edit({
            image: imageFileConverted,
            mask: maskFileConverted,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

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

        if (!response.data?.[0]?.b64_json) {
            throw new Error("No base64 image returned from OpenAI API");
        }

        const imageBase64 = response.data[0].b64_json;
        const imageName = `inpainted-${timestamp}.png`;
        const publicPath = path.join(process.cwd(), 'public', 'images');

        // Ensure the directory exists for saving images
        if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath, { recursive: true });
        }

        // Convert base64 string to Buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Save the image to the file system
        const filePath = path.join(publicPath, imageName);

        // Handle potential file system errors
        try {
            fs.writeFileSync(filePath, imageBuffer);
        } catch (fsError) {
            console.error('Failed to save the image file:', fsError);
            return NextResponse.json(
                { error: "Failed to save the generated image" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            imagePath: `/images/${imageName}`,
            responseFile: `/logs/openai_response_${timestamp}.txt`, // Return the path to the response file
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
