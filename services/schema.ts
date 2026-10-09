import { json, pgTable, serial, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const CourseDetails = pgTable("CourseDetails", {
  id:serial('id').primaryKey(),
  courseId:varchar('course_id'),
  name:varchar('name'),
  description:varchar('description'),
  duration:varchar('duration'),
  level:varchar('level'),
  userName:varchar('user_name'),
  userProfileImage:varchar('user_profile_image'),
  createdBy:varchar('created_by'),
  roadmap:json('roadmap'),
  includeVideos:boolean('include_videos'),
  nextVideoToWatch:varchar('next_video_to_watch'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const CourseVideos = pgTable("course_videos", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 255 }).notNull(),
  chapterTitle: varchar("chapter_title", { length: 255 }).notNull(),
  subtopicName: varchar("subtopic_name", { length: 255 }).notNull(),
  videoData: json("video_data"), // Store the selected video object
  createdAt: timestamp("created_at").defaultNow(),
});

export const CourseContent = pgTable("course_content", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 255 }).notNull(),
  chapterTitle: varchar("chapter_title", { length: 255 }).notNull(),
  subtopicName: varchar("subtopic_name", { length: 255 }).notNull(),
  contentData: json("content_data"), // Store the generated content object
  createdAt: timestamp("created_at").defaultNow(),
}); 



export const UserProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Auth user ID (e.g., Clerk)
  courseId: varchar("course_id", { length: 255 }).notNull(),
  chapterTitle: varchar("chapter_title", { length: 255 }).notNull(),
  subtopicName: varchar("subtopic_name", { length: 255 }).notNull(),
  isWatched: boolean("is_watched").default(false),
  watchedAt: timestamp("watched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const Certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID
  courseId: varchar("course_id", { length: 255 }).notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  certificateUrl: varchar("certificate_url", { length: 500 }), // PDF file path/URL
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, failed
  requestedAt: timestamp("requested_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)'; // Gemini text-embedding-004 has 768 dimensions
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === 'string') {
      return value.slice(1, -1).split(',').map(Number);
    }
    return value as number[];
  },
});

export const CourseEmbeddings = pgTable("course_embeddings", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 255 }).notNull(),
  chapterTitle: varchar("chapter_title", { length: 255 }).notNull(),
  subtopicName: varchar("subtopic_name", { length: 255 }).notNull(),
  chunkText: varchar("chunk_text", { length: 4000 }).notNull(),
  embedding: vector("embedding").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
import { v4 as uuidv4 } from "uuid";
export const users = pgTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey().$defaultFn(() => uuidv4()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
});

import { text } from "drizzle-orm/pg-core";

export const accounts = pgTable("account", {
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("session", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
