import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const moviePath =
      process.env.MOVIE_PATH || path.join(process.cwd(), "movies", "movie.mp4");

    // Check file exists
    if (!fs.existsSync(moviePath)) {
      return NextResponse.json(
        { error: "Movie file not found" },
        { status: 404 }
      );
    }

    const stat = fs.statSync(moviePath);
    const fileSize = stat.size;

    const stream = fs.createReadStream(moviePath);

    // Convert Node.js readable stream to a Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="aether-movie.mp4"',
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download error" },
      { status: 500 }
    );
  }
}

// Disable body parsing and set max duration for streaming
export const dynamic = "force-dynamic";
