import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

window.alert = jest.fn();
window.confirm = jest.fn();

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = class {
    encode(input = '') {
      const buffer = new ArrayBuffer(input.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < input.length; i++) {
        view[i] = input.charCodeAt(i);
      }
      return view;
    }
  };
  
  (globalThis as any).TextDecoder = class {
    decode(buffer: Uint8Array) {
      return String.fromCharCode(...buffer);
    }
  };
}

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (
        args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Erro ao buscar decks') ||
        args[0].includes('Falha na conexão')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});