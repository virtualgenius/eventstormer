import type Konva from "konva";

export const exportCanvasToImage = (stage: Konva.Stage | null, filename: string = "eventstormer-board.png") => {
  if (!stage) {
    console.error("Stage reference not available");
    return;
  }

  // Get the stage's data URL
  const dataURL = stage.toDataURL({
    mimeType: "image/png",
    quality: 1,
    pixelRatio: 2 // Higher resolution for better quality
  });

  // Create download link
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
