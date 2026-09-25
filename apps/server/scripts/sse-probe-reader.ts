/** Test-only reader: TCP chunks and SSE frames are independent boundaries. */
export async function readFirstSseData(reader: ReadableStreamDefaultReader<Uint8Array>, maxBytes = 8192) {
  const decoder = new TextDecoder();
  let buffer = '';
  let bytes = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) throw new Error('PROBE_SSE_CLOSED_BEFORE_DATA');
    bytes += chunk.value.byteLength;
    if (bytes > maxBytes) throw new Error('PROBE_SSE_FRAME_TOO_LARGE');
    buffer += decoder.decode(chunk.value, { stream: true });
    let boundary: RegExpExecArray | null;
    while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
      const frame = buffer.slice(0, boundary.index);
      buffer = buffer.slice(boundary.index + boundary[0].length);
      const data = frame.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, ''));
      if (data.length) return { data: data.join('\n'), remainder: buffer, decoder };
    }
  }
}
