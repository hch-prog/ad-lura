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

        if (!prompt || !imageFile || !maskFile) {
            return NextResponse.json(
                { error: "Prompt, image, and mask are required" },
                { status: 400 }
            );
        }

        // Convert files to OpenAI format
        const imageFileConverted = await toFile(imageFile, "image.png");
        const maskFileConverted = await toFile(maskFile, "mask.png");

        const response = await openai.images.edit({
            image: imageFileConverted,
            mask: maskFileConverted,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        if (!response.data?.[0]?.url) {
            throw new Error("No image generated");
        }

        const imageUrl = response.data[0].url;
        const imageName = `inpainted-${Date.now()}.png`;
        const publicPath = path.join(process.cwd(), 'public', 'images');
        
        if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath, { recursive: true });
        }

        // Fetch and save the image
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        fs.writeFileSync(path.join(publicPath, imageName), Buffer.from(imageBuffer));

        return NextResponse.json({
            success: true,
            imagePath: `/images/${imageName}`,
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}