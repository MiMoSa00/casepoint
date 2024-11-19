import { User } from "firebase/auth";

/**
 * Retrieves the Firebase ID token for a given user.
 * @param user - Firebase authenticated user
 * @param forceRefresh - Force token refresh if true
 * @returns Promise<string> - ID token as a string
 */
export const getIdToken = async (user: User, forceRefresh = false): Promise<string> => {
  return await user.getIdToken(forceRefresh);
};
