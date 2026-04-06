import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Max chunk size: 2MB for memory-safe streaming
const CHUNK_SIZE = 2 * 1024 * 1024;

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
    const range = request.headers.get("range");

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const requestedEnd = parts[1] ? parseInt(parts[1], 10) : undefined;
      const end = requestedEnd
        ? Math.min(requestedEnd, fileSize - 1)
        : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(moviePath, { start, end });

      // Convert Node.js readable stream to a Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          let closed = false;
          stream.on("data", (chunk) => {
            if (!closed) {
              try { controller.enqueue(chunk); } catch {}
            }
          });
          stream.on("end", () => {
            if (!closed) {
              closed = true;
              try { controller.close(); } catch {}
            }
          });
          stream.on("error", (err) => {
            if (!closed) {
              closed = true;
              try { controller.error(err); } catch {}
            }
          });
        },
        cancel() {
          stream.destroy();
        },
      });

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
          "Cache-Control": "no-cache",
        },
      });
    }

    // No range → return full file (for initial requests)
    const stream = fs.createReadStream(moviePath);
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
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json(
      { error: "Streaming error" },
      { status: 500 }
    );
  }
}

// Disable body parsing and set max duration for streaming
export const dynamic = "force-dynamic";
