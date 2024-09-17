import { min } from 'lodash-es';
import { Text } from '../ui/styled/text';
import { HStack, Stack } from 'styled-system/jsx';
import type { Preset } from '~/utils/presets';

export function Template({
  preset,
  baseSize,
  placeholderData,
  transparent
}: {
  preset: Preset;
  baseSize?: number;
  placeholderData?: Record<string, string>;
  transparent?: boolean;
}) {
  const { data: presetData } = preset;

  const minSize = min(presetData.flatMap((p) => p.map((a) => a.size))) ?? 1;
  return (
    <Stack
      style={{ fontSize: `${baseSize ?? minSize}px` }}
      gap={0}
      fontFamily={'Meiryo'}
      fontWeight="bold"
      flexWrap="nowrap"
    >
      {presetData.map((line, row) => {
        return (
          <HStack key={row} gap="1" alignItems="center" flexWrap="nowrap">
            {line.map((l, col) => {
              const size = l.size / minSize;
              if (l.placeholder) {
                const text = placeholderData?.[l.placeholder.key] || l.placeholder.default;
                const textSize = Math.min(
                  (l.placeholder.default.length / text.length) * size,
                  size
                );

                return (
                  <Text
                    key={col}
                    style={{
                      fontSize: `${textSize}em`,
                      color: transparent ? 'transparent' : 'var(--colors-bg-default)'
                    }}
                    flexGrow={99}
                    width="100%"
                    h="full"
                    py={1.25}
                    px={1}
                    color="bg.default"
                    textWrap="nowrap"
                    // lineHeight="tight"
                    bgColor="fg.default"
                    mixBlendMode={{
                      base: 'multiply',
                      _dark: 'screen'
                    }}
                    textAlignLast="justify"
                  >
                    {text}
                  </Text>
                );
              }
              return (
                <Text
                  key={col}
                  style={{ fontSize: `${size}em` }}
                  flex={1}
                  textWrap="nowrap"
                  // lineHeight="tight"
                  textAlignLast="justify"
                >
                  {l.text}
                </Text>
              );
            })}
          </HStack>
        );
      })}
    </Stack>
  );
}
