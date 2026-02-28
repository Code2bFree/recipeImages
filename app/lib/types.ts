export type HistoryStatus = "loading" | "done" | "error";

export type HistoryItem = {
  id: string;
  createdAt: number;
  recipeText: string;
  defaultPrompt: string;
  finalPrompt: string;
  status: HistoryStatus;
  imageDataUrl?: string;
  error?: string;
};
