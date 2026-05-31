export const MAX_VOICE_AUDIO_BYTES = 700_000;

export type VoiceTranscriptionResult =
  | { status: "transcribed"; transcript: string }
  | { status: "configuration_missing"; missing: "GROQ_API_KEY" };

export async function transcribeVoice(args: {
  audioBase64: string;
  mimeType: string;
}): Promise<VoiceTranscriptionResult> {
  const byteLength = base64ByteLength(args.audioBase64);
  if (byteLength > MAX_VOICE_AUDIO_BYTES) {
    throw new Error("VOICE_AUDIO_TOO_LARGE");
  }

  const apiKey = env("GROQ_API_KEY");
  if (!apiKey) {
    return { status: "configuration_missing", missing: "GROQ_API_KEY" };
  }

  const form = new FormData();
  form.append("model", "whisper-large-v3");
  form.append("file", base64ToBlob(args.audioBase64, args.mimeType), `voice-command.${extensionForMimeType(args.mimeType)}`);

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`VOICE_TRANSCRIPTION_FAILED_${response.status}`);
  }

  const body = await response.json() as { text?: unknown };
  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    throw new Error("VOICE_TRANSCRIPTION_EMPTY");
  }

  return { status: "transcribed", transcript: body.text.trim() };
}

function base64ByteLength(value: string): number {
  const normalized = value.trim();
  if (normalized.length === 0) return 0;
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

function base64ToBlob(value: string, mimeType: string): Blob {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "m4a";
}

function env(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
}
