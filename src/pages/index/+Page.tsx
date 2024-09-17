import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { FaCopy, FaDownload } from 'react-icons/fa6';
import { useToaster } from '../../context/ToasterContext';

import { Box, HStack, Stack } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import * as RadioGroup from '~/components/ui/styled/radio-group';
import { PRESETS } from '~/utils/presets';
import { Template } from '~/components/template/Template';
import { Input } from '~/components/ui/styled/input';
import { Button } from '~/components/ui/styled/button';

export function Page() {
  const { toast } = useToaster();
  const { t, i18n } = useTranslation();
  const [presetIndex, setPresetIndex] = useState(0);
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});

  const preset = PRESETS[presetIndex];
  const placeholders = PRESETS[presetIndex].data.flatMap((d) => d.filter((e) => !!e.placeholder));

  const title = 'Dumb Shirt Maker';

  const replacePlaceholder = (templateString: string, placeholderData: Record<string, string>) => {
    return templateString.replaceAll(/<(.*?)>/g, (_, key) => {
      return (
        placeholderData[key] ||
        placeholders.find((p) => p.placeholder?.key === key)?.placeholder?.default ||
        `<${key}>`
      );
    });
  };

  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const makeScreenshot = async () => {
    setShowRenderingCanvas(true);
    toast?.(t('toast.generating_screenshot'));
    const toCanvas = await import('html2canvas-add-mix-blend-mode').then(
      (module) => module.default
    );
    const resultsBox = document.getElementById('results');

    if (resultsBox) {
      const canvas = await toCanvas(resultsBox, { backgroundColor: 'transparent' });
      setShowRenderingCanvas(false);
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image not generated'));
            }
          },
          'image/png',
          1
        )
      );
    }
  };

  const screenshot = async () => {
    const shareImage = await makeScreenshot();
    if (!shareImage) return;
    try {
      await navigator.share({
        text: t('share.copy_text'),
        files: [new File([shareImage], 'll-sorted.png')]
      });
    } catch {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareImage }, { presentationStyle: 'attachment' })
      ]);
    }
  };

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(new File([blob], `${replacePlaceholder(preset.text, placeholderData)}.png`));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <RadioGroup.Root
          defaultValue={`0`}
          value={`${presetIndex}`}
          onValueChange={({ value }) => setPresetIndex(Number(value))}
        >
          {PRESETS.map((option, index) => {
            const text = replacePlaceholder(option.text, placeholderData);
            return (
              <RadioGroup.Item key={index} value={`${index}`}>
                <RadioGroup.ItemControl />
                <RadioGroup.ItemText>{text}</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
        {placeholders.map(({ placeholder }) => {
          if (!placeholder) return null;
          return (
            <Input
              key={placeholder.key}
              value={placeholderData?.[placeholder.key]}
              defaultValue={placeholder.default}
              onChange={(e) =>
                setPlaceholderData((d) => ({ ...d, [placeholder.key]: e.target.value }))
              }
            />
          );
        })}
        <Template preset={preset} baseSize={50} placeholderData={placeholderData} />
      </Stack>
      <HStack justifyContent="center">
        <Button variant="subtle" onClick={() => void screenshot()}>
          <FaCopy /> {t('results.copy')}
        </Button>
        <Button onClick={() => void download()}>
          <FaDownload /> {t('results.download')}
        </Button>
      </HStack>
      {showRenderingCanvas && (
        <Box position="absolute" w="0" h="0" overflow="hidden">
          <Stack id="results" w="fit-content" h="fit-content">
            <Template preset={preset} placeholderData={placeholderData} transparent />
          </Stack>
        </Box>
      )}
    </>
  );
}
