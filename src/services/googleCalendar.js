const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient;
let accessToken = null;

export function initGoogleIdentity() {
  return new Promise((resolve) => {
    // Check if gapi and accounts are available
    const checkInterval = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(checkInterval);
        
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error !== undefined) {
              throw response;
            }
            accessToken = response.access_token;
            resolve(accessToken);
          },
        });
        resolve();
      }
    }, 100);
  });
}

export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google Identity not initialized"));
      return;
    }
    
    // Override callback to resolve this specific promise
    tokenClient.callback = (response) => {
      if (response.error !== undefined) {
        reject(response);
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };
    
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export async function createCalendarEvent(session, isCompleted = false) {
  if (!accessToken) {
    await requestAccessToken();
  }

  const title = (isCompleted ? "✅ " : "🏃 ") + `${session.type} Run: ${session.distance} km`;
  const description = `${session.notes}\n\nType: ${session.type}\nAfstand: ${session.distance} km\nStatus: ${isCompleted ? "Voltooid" : "Gepland"}`;

  const event = {
    summary: title,
    description: description,
    start: {
      date: session.date,
      timeZone: "Europe/Amsterdam",
    },
    end: {
      date: session.date,
      timeZone: "Europe/Amsterdam",
    },
    colorId: getColorId(session.type),
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      // Token expired, retry once after requesting new token
      accessToken = null;
      await requestAccessToken();
      return createCalendarEvent(session, isCompleted);
    }
    throw new Error(error.error.message);
  }

  return response.json();
}

function getColorId(type) {
  // Google Calendar color IDs: 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana, 
  // 6: Tangerine, 7: Peacock, 8: Graphite, 9: Blueberry, 10: Basil, 11: Tomato
  switch (type) {
    case "Easy": return "10"; // Basil (Green)
    case "Long": return "9";  // Blueberry (Blue)
    case "Tempo": return "6";  // Tangerine (Orange)
    case "Interval": return "11"; // Tomato (Red)
    case "RACE": return "3"; // Grape (Purple)
    default: return "1";
  }
}
