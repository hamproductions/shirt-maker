import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import './src/index.css';

import { afterEach, beforeAll, beforeEach, vi } from 'vitest';

beforeAll(() => {
  configure({
    asyncUtilTimeout: import.meta.env.CI === true ? undefined : 2000
  });
});
beforeEach(() => {
  // @ts-expect-error Mock
  window.PointerEvent = MouseEvent;
  // @ts-expect-error Mock
  delete window.location;
  // @ts-expect-error Mock
  window.location = new URL('http://localhost/');
  window.localStorage.clear();
  window.FontFace = vi.fn().mockImplementation((_fontFamily: string, _source: string) => {
    return {
      load: () => Promise.resolve()
    };
  });
  // @ts-expect-error Mock
  window.document.fonts = { add: vi.fn() };
  HTMLCanvasElement.prototype.getContext = vi.fn();
});

afterEach(() => {
  // onTestFailed(() => {
  // debug();
  // screen.debug();
  // });

  cleanup(); // clear testing data after each test run
  vi.resetAllMocks();
});
