/** Client-side onboarding flag; synced with the server when `/api/onboarding` is available. */
export const LOCAL_ONBOARDING_COMPLETE_KEY = "gitluminary_onboarding_complete";

export function isOnboardingCompleteLocally(): boolean {
  return localStorage.getItem(LOCAL_ONBOARDING_COMPLETE_KEY) === "1";
}

export function setOnboardingCompleteLocally(): void {
  localStorage.setItem(LOCAL_ONBOARDING_COMPLETE_KEY, "1");
}
