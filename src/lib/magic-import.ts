import { PeerReview, Grant, Paper } from "./types";

export type MagicImportResult =
    | { type: "peer-review"; data: Partial<PeerReview> }
    | { type: "grant"; data: Partial<Grant> }
    | { type: "paper"; data: Partial<Paper> }
    | { type: "unknown"; error: string };

export async function processMagicImport(
    text: string,
    provider: "gemini" | "openai",
    apiKey: string
): Promise<MagicImportResult> {
    if (provider === "gemini") {
        return processWithGemini(text, apiKey);
    } else {
        return processWithOpenAI(text, apiKey);
    }
}

async function processWithGemini(text: string, apiKey: string): Promise<MagicImportResult> {
    const prompt = getImportPrompt(text);
    const models = ["gemini-3-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
    let lastError = "";

    for (const model of models) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json();
                lastError = err.error?.message || "Gemini API error";
                continue; // Try next model
            }

            const json = await response.json();
            let resultText = json.candidates[0].content.parts[0].text;

            if (resultText.includes("```")) {
                const match = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match) {
                    resultText = match[1];
                }
            }

            const parsed = JSON.parse(resultText.trim());
            return parsed as MagicImportResult;
        } catch (error: unknown) {
            lastError = error instanceof Error ? error.message : "Internal Server Error";
            continue;
        }
    }

    return { type: "unknown", error: `Gemini failed after trying multiple models. Last error: ${lastError}` };
}

async function processWithOpenAI(text: string, apiKey: string): Promise<MagicImportResult> {
    const prompt = getImportPrompt(text);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "OpenAI API error");
        }

        const json = await response.json();
        const resultText = json.choices[0].message.content;
        const parsed = JSON.parse(resultText);

        return parsed as MagicImportResult;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return { type: "unknown", error: message };
    }
}

function getImportPrompt(text: string): string {
    return `
    You are an academic dashboard assistant. Analyze the following text (likely an email) and extract information for an academic dashboard.
    Determine if it is a Peer Review Request, a Grant/Funding opportunity/update, or a Paper/Manuscript update.
    
    Return a JSON object in this format:
    {
      "type": "peer-review" | "grant" | "paper",
      "data": { ... relevant fields ... }
    }
    
    Fields for peer-review: journal, manuscriptTitle, manuscriptId, dueDate (YYYY-MM-DD), status ("invited")
    Fields for grant: title, agency, submissionDeadline (YYYY-MM-DD), status ("planning")
    Fields for paper: title, targetJournal, stage ("submitted" | "under-review" | "revise-resubmit" | "accepted")
    
    Only return a valid JSON object. Do not include any explanations, preamble, or markdown formatting outside the JSON itself.
    If you cannot determine the type, return {"type": "unknown", "error": "Could not identify the content type"}.
    
    JSON format to follow:
    {
      "type": "peer-review" | "grant" | "paper",
      "data": { ... }
    }
    
    Input Text:
    \"\"\"
    ${text}
    \"\"\"
  `;
}
