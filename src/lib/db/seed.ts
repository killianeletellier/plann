import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { hashPin } from "../auth/hash";
import { db } from "./client";
import {
  animationVolunteers,
  animations,
  artists,
  festivals,
  locations,
  posts,
  slotVolunteers,
  slots,
  taskVolunteers,
  tasks,
  users,
  volunteerRoles,
} from "./schema";

export async function seedDatabase() {
  const existing = await db.query.festivals.findFirst({
    where: eq(festivals.code, "C15-2026"),
  });
  if (existing) {
    const existingRoles = await db.query.volunteerRoles.findMany({
      where: eq(volunteerRoles.festivalId, existing.id),
    });
    if (existingRoles.length === 0) {
      const defaultRoles = ["Accueil", "Sécurité", "Bar", "Technique", "Régie"];
      await db.insert(volunteerRoles).values(
        defaultRoles.map((name) => ({
          id: uuidv4(),
          festivalId: existing.id,
          name,
        })),
      );
    }
    return existing.id;
  }

  const festivalId = uuidv4();
  await db.insert(festivals).values({
    id: festivalId,
    name: "C15 Festival 2026",
    code: "C15-2026",
    startDate: "2026-07-10",
    endDate: "2026-07-13",
  });

  const adminId = uuidv4();
  const volunteerIds = [uuidv4(), uuidv4(), uuidv4()];

  await db.insert(users).values([
    {
      id: adminId,
      festivalId,
      firstName: "Admin",
      lastName: "C15",
      phone: "0600000000",
      pinHash: await hashPin("1234"),
      isAdmin: true,
    },
    {
      id: volunteerIds[0],
      festivalId,
      firstName: "Marie",
      lastName: "Dupont",
      phone: "0611111111",
      pinHash: await hashPin("1111"),
      isAdmin: false,
    },
    {
      id: volunteerIds[1],
      festivalId,
      firstName: "Pierre",
      lastName: "Martin",
      phone: "0622222222",
      pinHash: await hashPin("2222"),
      isAdmin: false,
    },
    {
      id: volunteerIds[2],
      festivalId,
      firstName: "Sophie",
      lastName: "Bernard",
      phone: "0633333333",
      pinHash: await hashPin("3333"),
      isAdmin: false,
    },
  ]);

  const defaultRoles = ["Accueil", "Sécurité", "Bar", "Technique", "Régie"];
  await db.insert(volunteerRoles).values(
    defaultRoles.map((name) => ({
      id: uuidv4(),
      festivalId,
      name,
    })),
  );

  const locationIds = {
    scene: uuidv4(),
    bar: uuidv4(),
    accueil: uuidv4(),
    entree: uuidv4(),
    pv1: uuidv4(),
  };

  await db.insert(locations).values([
    {
      id: locationIds.scene,
      festivalId,
      name: "Scène principale",
      type: "scene",
      description: "Grande scène du festival",
      gridX: 3,
      gridY: 0,
      gridW: 6,
      gridH: 3,
    },
    {
      id: locationIds.bar,
      festivalId,
      name: "Bar",
      type: "point_de_vente",
      description: "Bar principal",
      gridX: 9,
      gridY: 0,
      gridW: 3,
      gridH: 2,
    },
    {
      id: locationIds.accueil,
      festivalId,
      name: "Accueil",
      type: "autre",
      description: "Point d'accueil bénévoles",
      gridX: 0,
      gridY: 2,
      gridW: 3,
      gridH: 2,
    },
    {
      id: locationIds.entree,
      festivalId,
      name: "Entrée",
      type: "autre",
      description: "Contrôle des entrées",
      gridX: 0,
      gridY: 0,
      gridW: 3,
      gridH: 2,
    },
    {
      id: locationIds.pv1,
      festivalId,
      name: "Point de vente 1",
      type: "point_de_vente",
      description: "Merchandising",
      gridX: 9,
      gridY: 2,
      gridW: 3,
      gridH: 2,
    },
  ]);

  const artistIds = [uuidv4(), uuidv4()];
  await db.insert(artists).values([
    {
      id: artistIds[0],
      festivalId,
      name: "Les Échos",
      phone: "0644444444",
      description: "Groupe rock local",
    },
    {
      id: artistIds[1],
      festivalId,
      name: "DJ Nova",
      phone: "0655555555",
      description: "DJ électro",
    },
  ]);

  const animationId = uuidv4();
  await db.insert(animations).values({
    id: animationId,
    festivalId,
    locationId: locationIds.scene,
    artistId: artistIds[0],
    title: "Concert Les Échos",
    startAt: "2026-07-11T20:00:00.000Z",
    endAt: "2026-07-11T22:00:00.000Z",
  });

  await db.insert(animationVolunteers).values({
    id: uuidv4(),
    animationId,
    userId: volunteerIds[0],
    role: "Régie",
  });

  const taskId = uuidv4();
  await db.insert(tasks).values({
    id: taskId,
    festivalId,
    locationId: locationIds.entree,
    title: "Installation signalétique",
    description: "Poser les panneaux directionnels",
    startAt: "2026-07-10T08:00:00.000Z",
    endAt: "2026-07-10T12:00:00.000Z",
  });

  await db.insert(taskVolunteers).values([
    {
      id: uuidv4(),
      taskId,
      userId: volunteerIds[1],
      role: "Chef d'équipe",
    },
    {
      id: uuidv4(),
      taskId,
      userId: volunteerIds[0],
    },
  ]);

  const postId = uuidv4();
  await db.insert(posts).values({
    id: postId,
    festivalId,
    locationId: locationIds.bar,
    title: "Service bar",
    description: "Service et encaissement au bar",
  });

  const slotIds = [uuidv4(), uuidv4()];
  await db.insert(slots).values([
    {
      id: slotIds[0],
      postId,
      startAt: "2026-07-11T14:00:00.000Z",
      endAt: "2026-07-11T18:00:00.000Z",
    },
    {
      id: slotIds[1],
      postId,
      startAt: "2026-07-11T18:00:00.000Z",
      endAt: "2026-07-11T22:00:00.000Z",
    },
  ]);

  await db.insert(slotVolunteers).values([
    {
      id: uuidv4(),
      slotId: slotIds[0],
      userId: volunteerIds[2],
    },
    {
      id: uuidv4(),
      slotId: slotIds[0],
      userId: volunteerIds[1],
    },
    {
      id: uuidv4(),
      slotId: slotIds[1],
      userId: volunteerIds[0],
    },
  ]);

  return festivalId;
}
