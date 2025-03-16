
/**
 * Safe version of tracking user visits that doesn't block auth flow
 */
export const safeTrackUserVisit = async (userId: string) => {
  try {
    // We wrap this in a Promise.race with a timeout to ensure it never hangs
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("Track user visit timeout")), 3000);
    });
    
    await Promise.race([
      fetch(`${window.location.origin}/api/track-visit?userId=${userId}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
      timeoutPromise
    ]);
  } catch (error) {
    console.error("Error tracking user visit (non-blocking):", error);
    // Don't throw - this is a background operation that shouldn't block auth
  }
};
