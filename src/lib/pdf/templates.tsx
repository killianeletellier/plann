import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface PdfEventRow {
  time: string;
  type: string;
  title: string;
  people: string;
  location: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 12, marginBottom: 20, color: "#666" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
  },
  colTime: { width: "15%" },
  colType: { width: "12%" },
  colTitle: { width: "28%" },
  colPeople: { width: "25%" },
  colLocation: { width: "20%" },
});

function EventTable({ events }: { events: PdfEventRow[] }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <Text style={styles.colTime}>Heure</Text>
        <Text style={styles.colType}>Type</Text>
        <Text style={styles.colTitle}>Titre</Text>
        <Text style={styles.colPeople}>Personnes</Text>
        <Text style={styles.colLocation}>Lieu</Text>
      </View>
      {events.map((e, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.colTime}>{e.time}</Text>
          <Text style={styles.colType}>{e.type}</Text>
          <Text style={styles.colTitle}>{e.title}</Text>
          <Text style={styles.colPeople}>{e.people}</Text>
          <Text style={styles.colLocation}>{e.location}</Text>
        </View>
      ))}
    </>
  );
}

export function LocationDayPdf({
  locationName,
  date,
  events,
}: {
  locationName: string;
  date: string;
  events: PdfEventRow[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{locationName}</Text>
        <Text style={styles.subtitle}>Planning du {date}</Text>
        <EventTable events={events} />
      </Page>
    </Document>
  );
}

export function LocationGlobalPdf({
  locationName,
  events,
}: {
  locationName: string;
  events: PdfEventRow[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{locationName}</Text>
        <Text style={styles.subtitle}>Planning global</Text>
        <EventTable events={events} />
      </Page>
    </Document>
  );
}

export function VolunteerDayPdf({
  volunteerName,
  date,
  events,
}: {
  volunteerName: string;
  date: string;
  events: PdfEventRow[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{volunteerName}</Text>
        <Text style={styles.subtitle}>Planning du {date}</Text>
        <EventTable events={events} />
      </Page>
    </Document>
  );
}

export function VolunteerGlobalPdf({
  volunteerName,
  events,
}: {
  volunteerName: string;
  events: PdfEventRow[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{volunteerName}</Text>
        <Text style={styles.subtitle}>Planning global</Text>
        <EventTable events={events} />
      </Page>
    </Document>
  );
}
