export const getTextDimensions = (ctx: CanvasRenderingContext2D, text: string) => {
  const size = ctx.measureText(text);
  return {
    width: Math.abs(size.actualBoundingBoxLeft) + Math.abs(size.actualBoundingBoxRight),
    height: Math.abs(size.actualBoundingBoxAscent) + Math.abs(size.actualBoundingBoxDescent)
  };
};
