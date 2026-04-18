import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const checkRateLimit = buildRateLimiter({ limit: 5, windowMs: 60 * 1000 }); // strict rate limit for file uploads

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const contentType = req.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data with an image file." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided. Use field name 'image'." },
        { status: 400 }
      );
    }

    // MIME type fallback for HEIC and other files
    let fileType = file.type;
    if (fileType === "" || fileType === "application/octet-stream") {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "heic") fileType = "image/heic";
      else if (extension === "jpg" || extension === "jpeg") fileType = "image/jpeg";
      else if (extension === "png") fileType = "image/png";
      else if (extension === "webp") fileType = "image/webp";
      else if (extension === "pdf") fileType = "application/pdf";
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType || "unknown"}. Supported: JPG, PNG, WEBP, HEIC, PDF.` },
        { status: 415 }
      );
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    // Convert file to base64 for Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    
    // PDF note: Gemini 1.5 Flash supports PDF, but for consistency with previous vision logic,
    // we focus on images for now.
    if (fileType === "application/pdf") {
      return NextResponse.json(
        { error: "PDF scanning is currently in maintenance. Please use JPG, PNG, or HEIC." },
        { status: 400 }
      );
    }

    // Prompt for receipt extraction
    const prompt = `You are a receipt parsing expert. Analyze the provided receipt image and extract the following details in JSON format:
- merchant (string): The name of the store or business.
- amount (string): Total amount paid as a string (e.g., "84.50").
- category (string): One of [food, transport, shopping, entertainment, health, utilities, other].
- date (string): Date in a human-readable format (e.g., "Apr 12, 2026").
- items (string array): List of individual items purchased (limit to top 5).
- confidence (number): Your confidence score from 0-100.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: fileType
        }
      }
    ]);

    const responseContent = result.response.text();
    const extracted = JSON.parse(responseContent);

    return NextResponse.json(
      {
        success: true,
        data: extracted,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
