import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a random 8-character alphanumeric token
 */
export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create an invite and return it
 */
export async function createInvite(
  supabase: SupabaseClient,
  inviterId: string,
  coupleId: string,
  type: "partner" | "friend"
) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

  const { data, error } = await supabase
    .from("invites")
    .insert({
      id: uuidv4(),
      token,
      inviter_id: inviterId,
      couple_id: coupleId,
      type,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get invite by token with inviter info
 */
export async function getInviteByToken(
  supabase: SupabaseClient,
  token: string
) {
  const { data, error } = await supabase
    .from("invites")
    .select(
      `
      *,
      inviter:users!inviter_id(id, email, user_metadata)
    `
    )
    .eq("token", token)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }

  return data;
}

/**
 * Accept an invite and update couple
 */
export async function acceptInvite(
  supabase: SupabaseClient,
  inviteId: string,
  userId: string,
  coupleId: string
) {
  // Update invite status
  const { error: inviteError } = await supabase
    .from("invites")
    .update({
      status: "accepted",
      accepted_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId);

  if (inviteError) throw inviteError;

  // Update couple with user2_id
  const { error: coupleError } = await supabase
    .from("couples")
    .update({
      user2_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", coupleId);

  if (coupleError) throw coupleError;
}

/**
 * Get invite URL using environment variable
 */
export function getInviteUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/invite/${token}`;
}

/**
 * Get all pending invites for a user
 */
export async function getPendingInvites(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("inviter_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Check if invite has expired
 */
export function isInviteExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}
