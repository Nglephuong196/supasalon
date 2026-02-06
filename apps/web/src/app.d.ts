// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: {
        user: {
          id: string;
          name: string;
          email: string;
          image?: string;
        };
        session: {
          id: string;
          expiresAt: string;
        };
      } | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
