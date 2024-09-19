import { max, min, sum } from 'lodash-es';
import { join } from 'path-browserify';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';
import { token } from 'styled-system/tokens';
import { useColorModeContext } from '~/context/ColorModeContext';
import { getTextDimensions } from '~/utils/canvas';
import type { Preset, PresetData } from '~/utils/presets';

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
  const [fontLoaded, setFontLoaded] = useState(false);

  const minSize = min(presetData.flatMap((p) => p.map((a) => a.size))) ?? 1;
  const { colorMode } = useColorModeContext();

  const canvasRef = ref ?? _canvasRef;

  const PADDING = 0.15 * (baseSize ?? minSize);
  const BOX_PADDING = 0.15 * (baseSize ?? minSize);

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

    ctx.textBaseline = 'bottom';
    ctx.fontKerning = 'none';

    const dimensions = presetData.map((row) =>
      row.map((col) => {
        const size = getRowSize(row);
        ctx.font = `bold ${size}px Meiryo`;
        const text = getColText(col);
        if ('placeholder' in col) {
          const { width, height } = getTextDimensions(ctx, text);
          return {
            width: width + 2 * BOX_PADDING,
            height: height + 2 * BOX_PADDING
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

    presetData.forEach((row) => {
      const hasPlaceholder = row.find((col) => 'placeholder' in col);

      const rowFontSize = getRowSize(row);
      ctx.font = `bold ${rowFontSize}px Meiryo`;

      const rowDimensions = row.map((col) => {
        const text = getColText(col);
        const size = getTextDimensions(ctx, text);
        return size.width;
      });
      const colWidth = row
        .filter((col) => !('placeholder' in col))
        .map((col) => {
          const text = getColText(col);
          const size = getTextDimensions(ctx, text);
          return size.width;
        });

      const flexSpace = totalWidth - (sum(colWidth) + PADDING * (row.length - 1));

      const rowHeight = getTextDimensions(ctx, getColText(row[0])).height;
      y += hasPlaceholder ? rowHeight + BOX_PADDING : rowHeight;

      row.forEach((col) => {
        const text = getColText(col);
        const textSize = getTextDimensions(ctx, text);
        // ctx.fillStyle = 'red';
        // ctx.fillRect(x - 2, y - 2, 4, 4);
        if ('placeholder' in col) {
          ctx.fillStyle = `${fgColor}`;
          const { actualBoundingBoxAscent, actualBoundingBoxLeft } = ctx.measureText(text);
          ctx.fillRect(
            x - actualBoundingBoxLeft,
            y - actualBoundingBoxAscent - BOX_PADDING,
            flexSpace,
            textSize.height + 2 * BOX_PADDING
          );
          ctx.globalCompositeOperation = 'xor';
          ctx.letterSpacing = `${
            (flexSpace - textSize.width - 2 * BOX_PADDING) / (text.length - 1)
          }px`;
          ctx.fillText(text, x + BOX_PADDING, y);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          if (!hasPlaceholder) {
            const characterCount = sum(row.map((col) => getColText(col).length));
            const colWidth = sum(rowDimensions);
            ctx.letterSpacing = `${(totalWidth - colWidth) / (characterCount - 1)}px`;
          }
          // ctx.fillStyle = `red`;
          // ctx.fillRect(
          //   x,
          //   y - size.height + (hasPlaceholder ? BOX_PADDING : 0),
          //   size.width,
          //   size.height
          // );
          ctx.fillStyle = `${fgColor}`;
          ctx.fillText(col.text, x, y, totalWidth);
        }
        x += textSize.width + PADDING;
        ctx.letterSpacing = '0px';
      });
      x = 0;
      y += hasPlaceholder ? PADDING + BOX_PADDING : PADDING;
    });
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const loadFont = async () => {
    try {
      const fontFace = new FontFace(
        'Meiryo',
        `url(${join(import.meta.env.BASE_URL, '/fonts/Meiryo-Bold.woff2')}) format('woff2')`
      );
      const font = await fontFace.load();
      document.fonts.add(font);
      setFontLoaded(true);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const f = async () => {
      if (!fontLoaded) await loadFont();
      setTimeout(() => {
        clearCanvas();
        renderContent();
      }, 0);
    };

    void f();
  }, [preset, placeholderData, colorMode]);

  return <canvas className={css({ fontFamily: 'var(--font-meiryo)' })} ref={canvasRef} />;
}
