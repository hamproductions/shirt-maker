import { max, min, sum } from 'lodash-es';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { token } from 'styled-system/tokens';
import { useColorModeContext } from '~/context/ColorModeContext';
import { getTextDimensions } from '~/utils/canvas';
import type { Preset, PresetData } from '~/utils/presets';

const PADDING = 4;
const BOX_PADDING = 4;

export function TemplateCanvas({
  ref,
  preset,
  baseSize,
  placeholderData
}: {
  ref?: RefObject<HTMLCanvasElement>;
  preset: Preset;
  baseSize?: number;
  placeholderData?: Record<string, string>;
}) {
  const { data: presetData } = preset;
  const _canvasRef = useRef<HTMLCanvasElement>(null);

  const minSize = min(presetData.flatMap((p) => p.map((a) => a.size))) ?? 1;
  const { colorMode } = useColorModeContext();

  const canvasRef = ref ?? _canvasRef;

  const getRowSize = (row: PresetData[number]) => (row[0].size / minSize) * (baseSize ?? minSize);
  const getColText = (col: PresetData[number][number]) =>
    'placeholder' in col
      ? placeholderData?.[col.placeholder.key] || col.placeholder.default
      : col.text;

  const renderContent = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const dimensions = presetData.map((row) =>
      row.map((col) => {
        const size = getRowSize(row);
        ctx.font = `bold ${size}px Meiryo`;
        const text = getColText(col);
        if ('placeholder' in col) {
          const { width, height } = getTextDimensions(ctx, text);
          return {
            width: width + 2 * PADDING,
            height: height + 2 * PADDING
          };
        }
        return getTextDimensions(ctx, text);
      })
    );

    const totalWidth =
      max(dimensions.map((row) => sum(row.map((col) => col.width)) + PADDING * (row.length - 1))) ??
      0;

    const totalHeight =
      sum(dimensions.map((row) => max(row.map((col) => col.height)))) +
      PADDING * (dimensions.length - 1);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    let x = 0;
    let y = 0;

    const fgColor = getComputedStyle(canvas).getPropertyValue(
      token('colors.fg.default').replace('var(', '').replace(')', '')
    );

    ctx.textBaseline = 'bottom';
    ctx.fontKerning = 'none';

    presetData.forEach((row) => {
      const size = getRowSize(row);
      ctx.font = `bold ${size}px Meiryo`;
      y += size;
      const hasPlaceholder = row.find((col) => 'placeholder' in col);
      const rowDimensions = row.map((col) => {
        const text = getColText(col);
        const size = getTextDimensions(ctx, text);
        return size.width;
      });
      if (!hasPlaceholder) {
        const characterCount = sum(row.map((col) => getColText(col).length));
        const colWidth = sum(rowDimensions);
        ctx.letterSpacing = `${(totalWidth - colWidth) / (characterCount - 1)}px`;
      }
      const colWidth = row
        .filter((col) => !('placeholder' in col))
        .map((col) => {
          const text = getColText(col);
          const size = getTextDimensions(ctx, text);
          return size.width;
        });
      const flexSpace = totalWidth - sum(colWidth);

      row.forEach((col) => {
        const text = getColText(col);
        const size = getTextDimensions(ctx, text);
        if ('placeholder' in col) {
          ctx.fillStyle = `${fgColor}`;
          ctx.fillRect(x, y - size.height, flexSpace, size.height + 2 * BOX_PADDING);
          ctx.globalCompositeOperation = 'xor';
          const spacing = (flexSpace - size.width - 4 * BOX_PADDING) / (text.length - 1);
          ctx.letterSpacing = `${spacing}px`;
          ctx.fillText(text, x + BOX_PADDING, y + BOX_PADDING, totalWidth);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          // ctx.fillStyle = `red`;
          // ctx.fillRect(
          //   x,
          //   y - size.height + (hasPlaceholder ? BOX_PADDING : 0),
          //   size.width,
          //   size.height
          // );
          ctx.fillStyle = `${fgColor}`;
          ctx.fillText(col.text, x, hasPlaceholder ? y + BOX_PADDING : y, totalWidth);
        }
        x += size.width + PADDING;
        ctx.letterSpacing = '0px';
      });
      x = 0;
      y += PADDING + (hasPlaceholder ? 2 * BOX_PADDING : 0);
    });
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    setTimeout(() => {
      clearCanvas();
      renderContent();
    }, 10);
  }, [preset, placeholderData, colorMode]);

  return <canvas ref={canvasRef} />;
}
