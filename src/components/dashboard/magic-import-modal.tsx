"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { processMagicImport, MagicImportResult } from "@/lib/magic-import";
import { useUserSettings } from "@/context/settings-context";
import { useDashboard } from "@/context/store-context";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";

interface MagicImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MagicImportModal({ isOpen, onClose }: MagicImportModalProps) {
    const { settings } = useUserSettings();
    const { peerReviews, grants, papers } = useDashboard();

    const [text, setText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<MagicImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleProcess() {
        if (!settings.aiApiKey) {
            setError("Please configure an AI API Key in Settings first.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            const res = await processMagicImport(
                text,
                settings.aiProvider || "gemini",
                settings.aiApiKey
            );

            if (res.type === "unknown") {
                setError(res.error);
            } else {
                setResult(res);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    }

    function handleConfirm() {
        if (!result || result.type === "unknown") return;

        if (result.type === "peer-review") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = result.data as Record<string, any>;
            peerReviews.add({
                manuscriptTitle: data.manuscriptTitle || "Unknown Title",
                journal: data.journal || "Unknown Journal",
                dueDate: data.dueDate || "",
                status: "accepted",
                notes: `Imported via Magic Import. Manuscript ID: ${data.manuscriptId || "N/A"}`,
                receivedDate: new Date().toISOString().split("T")[0],
                completedDate: "",
                linkedFiles: [],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } else if (result.type === "grant") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = result.data as Record<string, any>;
            grants.add({
                title: data.title || "Unknown Grant",
                agency: data.agency || "Unknown Agency",
                submissionDeadline: data.submissionDeadline || "",
                status: "planning",
                role: "PI",
                coInvestigators: [],
                startDate: "",
                endDate: "",
                notes: "Imported via Magic Import",
                linkedFiles: [],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } else if (result.type === "paper") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = result.data as Record<string, any>;
            papers.add({
                title: data.title || "Unknown Paper",
                targetJournal: data.targetJournal || "",
                stage: data.stage || "drafting",
                priority: "medium",
                abstract: data.abstract || "",
                coAuthors: data.coAuthors || [],
                submissionDate: data.submissionDate || "",
                decisionDate: data.decisionDate || "",
                notes: "Imported via Magic Import",
                linkedFiles: [],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        }

        onClose();
        setText("");
        setResult(null);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✨ Magic Import from Email">
            <div className="space-y-4">
                {!result ? (
                    <>
                        <p className="text-sm text-slate-500">
                            Paste the text of a reviewer request, grant deadline, or paper update below.
                            The AI will extract the key details for you.
                        </p>
                        <Loader2 className="hidden" /> {/* Added to prevent unused import error if needed */}
                        <Textarea
                            placeholder="Paste email content here..."
                            className="min-h-[200px]"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleProcess}
                                disabled={isProcessing || !text.trim()}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Extract Details
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    Detected: {result.type.replace("-", " ")}
                                </span>
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                            </div>

                            <div className="space-y-2">
                                {result.type !== "unknown" && Object.entries(result.data).map(([key, value]) => (
                                    <div key={key} className="flex flex-col">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase">{key}</span>
                                        <span className="text-sm font-medium text-slate-700">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 italic">
                            Review the details above. Clicking &quot;Confirm&quot; will add this item to your dashboard.
                        </p>

                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setResult(null)}>Back</Button>
                            <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                                <Check className="h-4 w-4 mr-2" />
                                Confirm & Add
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
