import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Chess game tables
    games: defineTable({
      userId: v.id("users"),
      board: v.array(v.array(v.union(v.string(), v.null()))), // 8x8 chess board
      currentTurn: v.union(v.literal("white"), v.literal("black")),
      difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      status: v.union(v.literal("active"), v.literal("finished"), v.literal("abandoned")),
      capturedPieces: v.object({
        white: v.array(v.string()),
        black: v.array(v.string()),
      }),
      moveHistory: v.array(v.object({
        from: v.object({ row: v.number(), col: v.number() }),
        to: v.object({ row: v.number(), col: v.number() }),
        piece: v.string(),
        capturedPiece: v.union(v.string(), v.null()),
        timestamp: v.number(),
      })),
      isCheck: v.boolean(),
      winner: v.union(v.literal("white"), v.literal("black"), v.literal("draw"), v.null()),
    }).index("by_user_id", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;