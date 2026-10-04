import "@testing-library/jest-dom";

const originalConsoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const [firstArg] = args;

    if (
      typeof firstArg === "string" &&
      /Keyborg instance .* is being disposed incorrectly\./.test(firstArg)
    ) {
      return;
    }

    originalConsoleError(...args);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
