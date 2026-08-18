import { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
  username: string;
  email: string;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  username: "",
  email: "",
};

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_SECRET as string,
  cookieName: "adi-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
