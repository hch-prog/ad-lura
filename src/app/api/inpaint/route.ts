import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const prompt = formData.get("prompt")?.toString();
        const imageFile = formData.get("image");
        const maskFile = formData.get("mask");

        // Ensure the prompt, image, and mask are provided
        if (!prompt || !imageFile || !maskFile) {
            return NextResponse.json(
                { error: "Prompt, image, and mask are required" },
                { status: 400 }
            );
        }

        // Convert the image and mask into files for OpenAI
        const imageFileConverted = await toFile(imageFile as Blob, null, { type: "image/png" });
        const maskFileConverted = await toFile(maskFile as Blob, null, { type: "image/png" });

        // Use OpenAI's image edit API (inpainting) to create a new image
        const rsp = await openai.images.edit({
            model: "gpt-image-1",
            image: imageFileConverted,
            mask: maskFileConverted,
            prompt,
        });

        // Check if the response contains valid data
        if (!rsp.data || rsp.data.length === 0 || !rsp.data[0].b64_json) {
            return NextResponse.json(
                { error: "Failed to generate image data or missing base64 data" },
                { status: 500 }
            );
        }

        const image_base64 = rsp.data[0].b64_json;

        // Check if image_base64 is a valid string before attempting to convert it to a buffer
        if (!image_base64 || typeof image_base64 !== 'string') {
            return NextResponse.json(
                { error: "Image base64 data is invalid or missing" },
                { status: 500 }
            );
        }

        const image_bytes = Buffer.from(image_base64, "base64");
        const filename = `edited-image-${Date.now()}.png`;

        // Save the generated image
        const imageDir = "./public/images";
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        const filePath = `${imageDir}/${filename}`;
        fs.writeFileSync(filePath, image_bytes);

        return NextResponse.json({
            success: true,
            imagePath: `/images/${filename}`,
        });
    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
