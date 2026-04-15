export interface cookiesOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: boolean | "strict" | "lax" | undefined;
}
