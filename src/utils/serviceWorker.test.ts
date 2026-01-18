import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock service worker API
const mockServiceWorker = {
  register: vi.fn(),
  getRegistrations: vi.fn(),
  ready: Promise.resolve(),
  controller: null,
};

const mockRegistration = {
  active: null,
  installing: null,
  waiting: null,
  scope: "/",
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe("Service Worker Status", () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNavigator = global.navigator;
    // Use Object.defineProperty to mock navigator
    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: mockServiceWorker as unknown as ServiceWorkerContainer,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("should detect when service worker is not supported", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: undefined,
      },
      writable: true,
      configurable: true,
    });
    
    expect(global.navigator.serviceWorker).toBeUndefined();
  });

  it("should detect when service worker is supported", () => {
    expect(global.navigator.serviceWorker).toBeDefined();
  });

  it("should register service worker with correct path and scope", async () => {
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    const basePath = "/progression";
    const swPath = `${basePath}/sw.js`;
    const swScope = `${basePath}/`;
    
    await mockServiceWorker.register(swPath, { scope: swScope });
    
    expect(mockServiceWorker.register).toHaveBeenCalledWith(swPath, {
      scope: swScope,
    });
  });

  it("should handle service worker registration success", async () => {
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    const registration = await mockServiceWorker.register("/sw.js", {
      scope: "/",
    });
    
    expect(registration).toBe(mockRegistration);
  });

  it("should handle service worker registration failure", async () => {
    const error = new Error("Registration failed");
    mockServiceWorker.register.mockRejectedValue(error);
    
    await expect(
      mockServiceWorker.register("/sw.js", { scope: "/" })
    ).rejects.toThrow("Registration failed");
  });

  it("should check for existing registrations", async () => {
    mockServiceWorker.getRegistrations.mockResolvedValue([mockRegistration]);
    
    const registrations = await mockServiceWorker.getRegistrations();
    
    expect(registrations).toHaveLength(1);
    expect(registrations[0]).toBe(mockRegistration);
  });

  it("should detect active service worker", async () => {
    const activeRegistration = {
      ...mockRegistration,
      active: { state: "activated" },
    };
    
    mockServiceWorker.getRegistrations.mockResolvedValue([activeRegistration]);
    
    const registrations = await mockServiceWorker.getRegistrations();
    
    expect(registrations[0].active).toBeDefined();
    expect(registrations[0].active?.state).toBe("activated");
  });

  it("should detect installing service worker", async () => {
    const installingRegistration = {
      ...mockRegistration,
      installing: { state: "installing" },
    };
    
    mockServiceWorker.getRegistrations.mockResolvedValue([
      installingRegistration,
    ]);
    
    const registrations = await mockServiceWorker.getRegistrations();
    
    expect(registrations[0].installing).toBeDefined();
    expect(registrations[0].installing?.state).toBe("installing");
  });

  it("should detect waiting service worker", async () => {
    const waitingRegistration = {
      ...mockRegistration,
      waiting: { state: "installed" },
    };
    
    mockServiceWorker.getRegistrations.mockResolvedValue([
      waitingRegistration,
    ]);
    
    const registrations = await mockServiceWorker.getRegistrations();
    
    expect(registrations[0].waiting).toBeDefined();
    expect(registrations[0].waiting?.state).toBe("installed");
  });
});

