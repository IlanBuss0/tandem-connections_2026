import * as legacy from './mockData';

export type UserRole = legacy.UserRole;
export type User = legacy.User;
export type Tutor = legacy.Tutor;
export type Professional = legacy.Professional;
export type Admin = legacy.Admin;
export type Activity = legacy.Activity;
export type ActivityCategory = legacy.ActivityCategory;
export type ActivityType = legacy.ActivityType;
export type RoutineItem = legacy.RoutineItem;
export type CalendarEvent = legacy.CalendarEvent;
export type Conversation = legacy.Conversation;
export type ChatMessage = legacy.ChatMessage;
export type Notification = legacy.Notification;
export type EmotionalRecord = legacy.EmotionalRecord;
export type Achievement = legacy.Achievement;
export type Objective = legacy.Objective;
export type Location = legacy.Location;
export type Recommendation = legacy.Recommendation;
export type Pictogram = legacy.Pictogram;
export type Resource = legacy.Resource;
export type PricingPlan = legacy.PricingPlan;

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

async function apiFetchWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  let last: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
        ...init,
      });
      if (!res.ok) {
        last = new Error(`HTTP ${res.status} on ${p}`);
        continue;
      }
      return (await res.json()) as T;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('Request failed');
}

export async function findUser(username: string, password: string): Promise<User | Tutor | Professional | Admin | null> {
  try {
    return await apiFetchWithFallback<User | Tutor | Professional | Admin | null>(['/auth/login', '/login'], {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return null;
  }
}

export async function fetchActivitiesForUser(userId: string): Promise<Activity[]> {
  return apiFetchWithFallback<Activity[]>([`/activities?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/activities`]);
}
export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
  return apiFetchWithFallback<Notification[]>([`/notifications?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/notifications`]);
}
export async function fetchConversationsForUser(userId: string): Promise<Conversation[]> {
  return apiFetchWithFallback<Conversation[]>([`/chat/conversations?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/conversations`]);
}
export async function fetchMessagesForConversation(conversationId: string): Promise<ChatMessage[]> {
  return apiFetchWithFallback<ChatMessage[]>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`]);
}
export async function sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<ChatMessage> {
  return apiFetchWithFallback<ChatMessage>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`], {
    method: 'POST',
    body: JSON.stringify({ senderId, senderName, text, type: 'text' }),
  });
}
export async function fetchAllUsers(): Promise<User[]> { return apiFetchWithFallback<User[]>(['/users']); }
export async function fetchAllTutors(): Promise<Tutor[]> { return apiFetchWithFallback<Tutor[]>(['/tutors']); }
export async function fetchAllProfessionals(): Promise<Professional[]> { return apiFetchWithFallback<Professional[]>(['/professionals']); }

export const resources: Resource[] = [];
export const achievements: Achievement[] = [];
export const pictograms: Pictogram[] = [];
export const pricingPlans: PricingPlan[] = [];

export const users: User[] = [];
export const tutors: Tutor[] = [];
export const professionals: Professional[] = [];
export const admins: Admin[] = [];
export const activities: Activity[] = [];
export const juanDailyRoutine: RoutineItem[] = [];
export const calendarEvents: CalendarEvent[] = [];
export const conversations: Conversation[] = [];
export const chatMessages: ChatMessage[] = [];
export const notifications: Notification[] = [];
export const emotionalRecords: EmotionalRecord[] = [];
export const objectives: Objective[] = [];
export const locations: Location[] = [];
export const recommendations: Recommendation[] = [];

export const getActivitiesForUser = (_: string): Activity[] => [];
export const getNotificationsForUser = (_: string): Notification[] => [];
export const getObjectivesForUser = (_: string): Objective[] => [];
export const getEmotionsForUser = (_: string): EmotionalRecord[] => [];
export const getLocationsForUser = (_: string): Location[] => [];
export const getRecommendationsForUser = (_: string): Recommendation[] => [];
export const getTutorById = (_: string): Tutor | undefined => undefined;
export const getProfessionalById = (_: string): Professional | undefined => undefined;
