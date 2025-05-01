import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { prompt, size, quality } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Define valid options for size and quality
        const validSizes = ["auto", "1024x1024", "1536x1024", "1024x1536"];
        const validQualities = ["auto", "low", "medium", "high"];

        // Validate size and quality
        if (!validSizes.includes(size)) {
            return NextResponse.json(
                { error: `Invalid size value. Valid values are: ${validSizes.join(", ")}` },
                { status: 400 }
            );
        }

        if (!validQualities.includes(quality)) {
            return NextResponse.json(
                { error: `Invalid quality value. Valid values are: ${validQualities.join(", ")}` },
                { status: 400 }
            );
        }

        // Generate the image with the selected size and quality
        const result = await openai.images.generate({
            model: "gpt-image-1",
            prompt,
            size,
            quality
        });

        if (!result.data || result.data.length === 0) {
            return NextResponse.json(
                { error: "Failed to generate image data" },
                { status: 500 }
            );
        }

        const image_base64 = result.data[0]?.b64_json;

        if (!image_base64) {
            return NextResponse.json(
                { error: "Image base64 data is missing" },
                { status: 500 }
            );
        }

        const filename = `${uuidv4()}.png`;

        const imageDir = path.join(process.cwd(), "public/images");
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        const filePath = path.join(imageDir, filename);
        const image_bytes = Buffer.from(image_base64, "base64");
        fs.writeFileSync(filePath, image_bytes);

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
