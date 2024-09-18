import { useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { FaCopy, FaDownload } from 'react-icons/fa6';
import { useToaster } from '../../context/ToasterContext';

import { Box, Center, HStack, Stack } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import * as RadioGroup from '~/components/ui/styled/radio-group';
import type { PlaceholderText } from '~/utils/presets';
import { PRESETS } from '~/utils/presets';
import { Input } from '~/components/ui/styled/input';
import { Button } from '~/components/ui/styled/button';
import { TemplateCanvas } from '~/components/template/TemplateCanvas';
import { Heading } from '~/components/ui/styled/heading';
import { Link } from '~/components/ui/styled/link';
import { Text } from '~/components/ui/styled/text';

export function Page() {
  const { toast } = useToaster();
  const { t } = useTranslation();
  const [presetIndex, setPresetIndex] = useState(0);
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preset = PRESETS[presetIndex];
  const placeholders = PRESETS[presetIndex].data.flatMap((d) =>
    d.filter((e): e is PlaceholderText => 'placeholder' in e)
  );

  const replacePlaceholder = (templateString: string, placeholderData: Record<string, string>) => {
    return templateString.replaceAll(/<(.*?)>/g, (_, key) => {
      return (
        placeholderData[key] ||
        placeholders.find((p) => p.placeholder?.key === key)?.placeholder?.default ||
        `<${key}>`
      );
    });
  };

  const makeScreenshot = async () => {
    toast?.(t('toast.generating_screenshot'));
    const resultsBox = document.getElementById('results');

    if (resultsBox) {
      const canvas = canvasRef.current;
      return await new Promise<Blob>((resolve, reject) => {
        canvas?.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image not generated'));
            }
          },
          'image/png',
          1
        );
      });
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
      <Metadata title={t('title')} helmet />
      <Center>
        <Stack alignItems="center" w="full" maxWidth="breakpoint-lg">
          <Heading as="h1" fontSize="2xl">
            {t('title')}
          </Heading>
          <Text>
            {t('description')}{' '}
            <Link href="https://x.com/luseo29/status/1799676661627252779" target="_blank">
              {t('original_link')}
            </Link>
          </Text>
          <Heading as="h2" fontSize="lg">
            {t('presets')}
          </Heading>
          <RadioGroup.Root
            defaultValue={`0`}
            value={`${presetIndex}`}
            size="sm"
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
          <Heading as="h2" fontSize="lg">
            {t('customize_text')}
          </Heading>
          <Text>{t('light_mode')}</Text>
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
          <Heading as="h2" fontSize="lg">
            {t('preview')}
          </Heading>
          {/* <Template preset={preset} baseSize={50} placeholderData={placeholderData} /> */}
          <TemplateCanvas preset={preset} baseSize={50} placeholderData={placeholderData} />
          <HStack justifyContent="center">
            <Button variant="subtle" onClick={() => void screenshot()}>
              <FaCopy /> {t('copy')}
            </Button>
            <Button onClick={() => void download()}>
              <FaDownload /> {t('download')}
            </Button>
          </HStack>
        </Stack>
      </Center>
      <Box position="absolute" w="0" h="0" overflow="hidden">
        <Stack id="results" w="fit-content" h="fit-content">
          <TemplateCanvas ref={canvasRef} preset={preset} placeholderData={placeholderData} />
          {/* <Template preset={preset} placeholderData={placeholderData} transparent /> */}
        </Stack>
      </Box>
    </>
  );
}
