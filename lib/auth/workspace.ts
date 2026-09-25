import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { getSessionFromRequest, getServerSession } from "./session";
import { connectToDatabase } from "@/lib/db/connection";
import { User, IUser } from "@/models/User";
import { Workspace, IWorkspace } from "@/models/Workspace";
import { Membership, IMembership } from "@/models/Membership";

export interface AuthenticatedWorkspaceContext {
  user: IUser;
  workspace: IWorkspace;
  membership: IMembership;
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

/**
 * Resolves the authenticated user, their current active workspace,
 * and workspace membership from the incoming request or server session.
 *
 * If a valid user has no workspace yet (e.g. initial Google sign-in),
 * a personal workspace is automatically provisioned for them.
 *
 * Returns null if the request is unauthenticated or the user does not exist.
 */
export async function getCurrentWorkspace(
  req?: NextRequest
): Promise<AuthenticatedWorkspaceContext | null> {
  const session = req ? getSessionFromRequest(req) : await getServerSession();
  if (!session || !session.userId) {
    return null;
  }

  await connectToDatabase();

  const user = await User.findById(session.userId);
  if (!user) {
    return null;
  }

  // 1. Try to find the user's default workspace
  let workspace: IWorkspace | null = null;
  let membership: IMembership | null = null;

  if (user.defaultWorkspaceId) {
    workspace = await Workspace.findById(user.defaultWorkspaceId);
    if (workspace) {
      membership = await Membership.findOne({
        workspaceId: workspace._id,
        userId: user._id,
      });
    }
  }

  // 2. If not found by default, find any workspace membership for this user
  if (!workspace || !membership) {
    membership = await Membership.findOne({ userId: user._id });
    if (membership) {
      workspace = await Workspace.findById(membership.workspaceId);
    }
  }

  // 3. If user still has no workspace, provision their primary personal workspace
  if (!workspace) {
    const slugBase = (user.name || "workspace")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 20);
    const uniqueSlug = `${slugBase}-${user._id.toString().slice(-6)}`;

    workspace = await Workspace.create({
      name: `${user.name || "My"}'s Workspace`,
      slug: uniqueSlug,
      ownerId: user._id,
    });

    membership = await Membership.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: "OWNER",
    });

    user.defaultWorkspaceId = workspace._id;
    await user.save();
  }

  // Ensure membership exists
  if (!membership && workspace) {
    membership = await Membership.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: user.role === "OWNER" ? "OWNER" : "MEMBER",
    });
  }

  return {
    user,
    workspace,
    membership: membership!,
    workspaceId: workspace._id,
    userId: user._id,
  };
}
