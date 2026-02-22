const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar";

let tokenClient;
let accessToken = null;
let marathonCalendarId = null;

export function initGoogleIdentity() {
  return new Promise((resolve) => {
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
            marathonCalendarId = null; // Reset on new token
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
    
    tokenClient.callback = (response) => {
      if (response.error !== undefined) {
        reject(response);
        return;
      }
      accessToken = response.access_token;
      marathonCalendarId = null; // Reset on new token
      resolve(accessToken);
    };
    
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

async function getMarathonCalendarId() {
  if (marathonCalendarId) return marathonCalendarId;

  // List calendar list
  const data = await googleApiFetch("https://www.googleapis.com/calendar/v3/users/me/calendarList");
  const existing = (data.items || []).find(c => c.summary === "Marathon Training");
  
  if (existing) {
    marathonCalendarId = existing.id;
    return marathonCalendarId;
  }

  // Create new calendar
  const newCal = await googleApiFetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: "Marathon Training" })
  });
  
  marathonCalendarId = newCal.id;
  return marathonCalendarId;
}

async function googleApiFetch(url, options = {}) {
  if (!accessToken) {
    await requestAccessToken();
    marathonCalendarId = null; // Reset ID in case user changed
  }

  const fetchWithToken = (token) => fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  let response = await fetchWithToken(accessToken);

  if (response.status === 401) {
    accessToken = null;
    await requestAccessToken();
    response = await fetchWithToken(accessToken);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Google API error: ${response.status}`);
  }

  // Handle empty response (e.g. 204 No Content from DELETE)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {};
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function findAllExistingEvents(date) {
  const calId = await getMarathonCalendarId();
  const d = new Date(date);
  const timeMin = new Date(d.getTime() - 86400000).toISOString();
  const timeMax = new Date(d.getTime() + 86400000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&q=Run`;
  
  const data = await googleApiFetch(url);
  const items = data.items || [];

  return items.filter(item => {
    const eventDate = item.start.date || (item.start.dateTime && item.start.dateTime.split("T")[0]);
    if (eventDate !== date) return false;

    const hasTag = item.description && item.description.includes("[MarathonDashboard]");
    const looksLikeRun = item.summary && (item.summary.includes("Run:") || item.summary.includes("Run: "));
    return hasTag || looksLikeRun;
  });
}

export async function deleteCalendarEvent(eventId) {
  const calId = await getMarathonCalendarId();
  await googleApiFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${eventId}`, {
    method: "DELETE"
  });
}

export async function syncCalendarEvent(session, isCompleted = false) {
  const calId = await getMarathonCalendarId();
  console.log(`Syncing to ${calId}: ${session.date}`);
  
  const existingEvents = await findAllExistingEvents(session.date);
  
  if (existingEvents.length > 1) {
    for (let i = 1; i < existingEvents.length; i++) {
        await deleteCalendarEvent(existingEvents[i].id).catch(err => console.error("Cleanup error:", err));
    }
  }

  const existingEvent = existingEvents[0];
  
  const title = (isCompleted ? "✅ " : "🏃 ") + `${session.type} Run: ${session.distance} km`;
  const description = `${session.notes}\n\nType: ${session.type}\nAfstand: ${session.distance} km\nStatus: ${isCompleted ? "Voltooid" : "Gepland"}\n\n[MarathonDashboard]`;

  const event = {
    summary: title,
    description: description,
    start: { date: session.date },
    end: { date: session.date },
    colorId: getColorId(session.type),
  };

  const method = existingEvent ? "PUT" : "POST";
  const url = existingEvent 
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${existingEvent.id}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;

  return googleApiFetch(url, {
    method: method,
    body: JSON.stringify(event),
  });
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
