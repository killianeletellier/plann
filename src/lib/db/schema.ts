import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const festivals = sqliteTable("festivals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
});

export const volunteerRoles = sqliteTable("volunteer_roles", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  pinHash: text("pin_hash").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["scene", "point_de_vente", "autre"],
  }).notNull(),
  description: text("description"),
  gridX: integer("grid_x").notNull().default(0),
  gridY: integer("grid_y").notNull().default(0),
  gridW: integer("grid_w").notNull().default(2),
  gridH: integer("grid_h").notNull().default(2),
});

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  description: text("description"),
});

export const animations = sqliteTable("animations", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  artistId: text("artist_id").references(() => artists.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
});

export const animationVolunteers = sqliteTable("animation_volunteers", {
  id: text("id").primaryKey(),
  animationId: text("animation_id")
    .notNull()
    .references(() => animations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  locationId: text("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
});

export const taskVolunteers = sqliteTable("task_volunteers", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  festivalId: text("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
});

export const slots = sqliteTable("slots", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
});

export const slotVolunteers = sqliteTable("slot_volunteers", {
  id: text("id").primaryKey(),
  slotId: text("slot_id")
    .notNull()
    .references(() => slots.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
});

export const festivalsRelations = relations(festivals, ({ many }) => ({
  users: many(users),
  volunteerRoles: many(volunteerRoles),
  locations: many(locations),
  artists: many(artists),
  animations: many(animations),
  tasks: many(tasks),
  posts: many(posts),
}));

export const volunteerRolesRelations = relations(volunteerRoles, ({ one }) => ({
  festival: one(festivals, {
    fields: [volunteerRoles.festivalId],
    references: [festivals.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [users.festivalId],
    references: [festivals.id],
  }),
  animationVolunteers: many(animationVolunteers),
  taskVolunteers: many(taskVolunteers),
  slotVolunteers: many(slotVolunteers),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [locations.festivalId],
    references: [festivals.id],
  }),
  animations: many(animations),
  tasks: many(tasks),
  posts: many(posts),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [artists.festivalId],
    references: [festivals.id],
  }),
  animations: many(animations),
}));

export const animationsRelations = relations(animations, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [animations.festivalId],
    references: [festivals.id],
  }),
  location: one(locations, {
    fields: [animations.locationId],
    references: [locations.id],
  }),
  artist: one(artists, {
    fields: [animations.artistId],
    references: [artists.id],
  }),
  volunteers: many(animationVolunteers),
}));

export const animationVolunteersRelations = relations(
  animationVolunteers,
  ({ one }) => ({
    animation: one(animations, {
      fields: [animationVolunteers.animationId],
      references: [animations.id],
    }),
    user: one(users, {
      fields: [animationVolunteers.userId],
      references: [users.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [tasks.festivalId],
    references: [festivals.id],
  }),
  location: one(locations, {
    fields: [tasks.locationId],
    references: [locations.id],
  }),
  volunteers: many(taskVolunteers),
}));

export const taskVolunteersRelations = relations(taskVolunteers, ({ one }) => ({
  task: one(tasks, {
    fields: [taskVolunteers.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskVolunteers.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [posts.festivalId],
    references: [festivals.id],
  }),
  location: one(locations, {
    fields: [posts.locationId],
    references: [locations.id],
  }),
  slots: many(slots),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  post: one(posts, {
    fields: [slots.postId],
    references: [posts.id],
  }),
  volunteers: many(slotVolunteers),
}));

export const slotVolunteersRelations = relations(slotVolunteers, ({ one }) => ({
  slot: one(slots, {
    fields: [slotVolunteers.slotId],
    references: [slots.id],
  }),
  user: one(users, {
    fields: [slotVolunteers.userId],
    references: [users.id],
  }),
}));

export type Festival = typeof festivals.$inferSelect;
export type VolunteerRole = typeof volunteerRoles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Animation = typeof animations.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Slot = typeof slots.$inferSelect;
