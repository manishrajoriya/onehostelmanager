export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Library {
  id: string;
  name: string;
  address: string;
}

export interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User) => Promise<void>;
  clearCurrentUser: () => Promise<void>;

  activeLibrary: Library | null;
  setActiveLibrary: (library: Library) => Promise<void>;
  clearActiveLibrary: () => Promise<void>;

  initializeStore: () => Promise<void>;
}