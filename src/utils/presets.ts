export type PresetData = {
  text?: string;
  size: number;
  placeholder?: { key: string; default: string };
}[][];
export type Preset = {
  text: string;
  data: PresetData;
};
export const PRESETS: Preset[] = [
  {
    text: '日本語は全て<oshi>から学んだ',
    data: [
      [{ text: '日本語は', size: 1070 }],
      [
        { text: '全て', size: 680 },
        { placeholder: { key: 'oshi', default: '女性声優' }, size: 680 }
      ],
      [{ text: 'から学んだ', size: 980 }]
    ]
  },
  {
    text: '日本語は全て<oshi>のため学んだ',
    data: [
      [{ text: '日本語は', size: 1070 }],
      [
        { text: '全て', size: 680 },
        { placeholder: { key: 'oshi', default: '女性声優' }, size: 680 }
      ],
      [{ text: 'のため学んだ', size: 800 }]
    ]
  },
  {
    text: '私が日本に来た理由は<oshi>を会うために',
    data: [
      [{ text: '私が日本に', size: 650 }],
      [{ text: '来た理由は', size: 800 }],
      [{ placeholder: { key: 'oshi', default: '女性声優' }, size: 700 }],
      [{ text: 'を会うために', size: 700 }]
    ]
  }
];
