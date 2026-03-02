export type EditHistoryStatus = "loading" | "done" | "error";

export type EditHistoryItem = {
  id: string;
  createdAt: number;
  prompt: string;
  finalPrompt: string;
  aspectRatio: string;
  status: EditHistoryStatus;

  // We persist the output image in IndexedDB; metadata in localStorage.
  outputImageDataUrl?: string;
  error?: string;
};
