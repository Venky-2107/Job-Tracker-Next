import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

// reads token from browser cookie
// document.cookie returns all cookies as a string like "token=abc; othercookie=xyz"
// we use regex to extract just the token value
// typeof window === "undefined" check ensures this doesn't run on the server
const getTokenFromCookie = () => {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
};

const initialState: AuthState = {
  // typeof window !== "undefined" checks if we're in the browser before touching localStorage.
  token: getTokenFromCookie(),
  isAuthenticated: !!getTokenFromCookie,
};

// creating the slice
const authSlice = createSlice({
  name: "Auth",
  initialState,
  reducers: {
    //  actions that are called from the components
    // ex: dispatch(setCredentials("adfads... <some token value>"))
    // reducer runs -> state.token updates -> everycomponent reading the token re-renders
    setCredentials: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
      // sets the cookie in the browser
      // path=/ means cookie is available on all routes
      // max-age sets expiry in seconds — 60*60*24*7 = 7 days
      document.cookie = `token=${action.payload}; path=/; max-age=${60 * 60 * 24 * 7}`;
    },
    logout: (state) => {
      state.token = null;
      localStorage.removeItem("token");
      // setting max-age=0 immediately expires and deletes the cookie
      document.cookie = "token=; path=/; max-age=0";
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

/**
 * same code in redux
 * // 1. Define action types manually
const SET_CREDENTIALS = "auth/setCredentials"
const LOGOUT = "auth/logout"

// 2. Create action creators manually
export const setCredentials = (token) => ({ 
  type: SET_CREDENTIALS, 
  payload: token 
})
export const logout = () => ({ type: LOGOUT })

// 3. Write reducer with switch statement
const initialState = { token: null, isAuthenticated: false }

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CREDENTIALS:
      return { ...state, token: action.payload, isAuthenticated: true }
    case LOGOUT:
      return { ...state, token: null, isAuthenticated: false }
    default:
      return state
  }
}
 */
