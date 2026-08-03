import { format, parseISO } from "date-fns";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { GanttLegendItem, GanttRow, GanttSlot } from "@/lib/gantt-data";
import {
  extractGanttLegend,
  ganttHasStatusIndicator,
} from "@/lib/gantt-data";
import {
  GANTT_OVERDUE_BORDER,
  GANTT_UNASSIGNED_BORDER,
} from "@/lib/mission-color";

function slotPct(time: number, minTime: number, maxTime: number): number {
  if (maxTime <= minTime) return 0;
  return Math.max(0, Math.min(100, ((time - minTime) / (maxTime - minTime)) * 100));
}

function slotBorderColor(slot: GanttSlot): string | undefined {
  if (slot.overdue) return GANTT_OVERDUE_BORDER;
  if (slot.unassigned) return GANTT_UNASSIGNED_BORDER;
  return undefined;
}

const LABEL_WIDTH = 110;
const TIMELINE_WIDTH = 640;
const ROW_HEIGHT = 22;
const BAR_HEIGHT = 16;

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: LABEL_WIDTH,
  },
  hourLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    color: "#71717a",
  },
  groupHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rowLabel: {
    width: LABEL_WIDTH,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 9,
    fontWeight: "bold",
  },
  rowSubtitle: {
    fontSize: 7,
    color: "#71717a",
  },
  timelineTrack: {
    width: TIMELINE_WIDTH,
    height: ROW_HEIGHT,
    backgroundColor: "#f4f4f5",
    borderRadius: 3,
    position: "relative",
  },
  bar: {
    position: "absolute",
    top: (ROW_HEIGHT - BAR_HEIGHT) / 2,
    height: BAR_HEIGHT,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  barLabel: {
    fontSize: 6,
    color: "#ffffff",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendSwatchBorder: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#e4e4e7",
    borderWidth: 2,
  },
  legendText: {
    fontSize: 8,
    color: "#71717a",
  },
  empty: {
    fontSize: 10,
    color: "#71717a",
    textAlign: "center",
    marginTop: 40,
  },
});

function GanttBar({
  slot,
  minTime,
  maxTime,
}: {
  slot: GanttRow["slots"][number];
  minTime: number;
  maxTime: number;
}) {
  const start = parseISO(slot.startAt).getTime();
  const end = parseISO(slot.endAt).getTime();
  const leftPct = slotPct(start, minTime, maxTime);
  const widthPct = Math.max(slotPct(end, minTime, maxTime) - leftPct, 0.5);
  const left = (leftPct / 100) * TIMELINE_WIDTH;
  const width = Math.max((widthPct / 100) * TIMELINE_WIDTH, 2);
  const timeLabel = format(parseISO(slot.startAt), "HH:mm");
  const barLabel = slot.label ?? timeLabel;
  const minWidthForLabel = slot.label ? 36 : 18;
  const borderColor = slotBorderColor(slot);

  return (
    <View
      style={[
        styles.bar,
        {
          left,
          width,
          backgroundColor: slot.color,
          ...(borderColor
            ? { borderWidth: 2, borderColor, borderStyle: "solid" as const }
            : {}),
        },
      ]}
    >
      {width > minWidthForLabel ? (
        <Text style={styles.barLabel}>{barLabel}</Text>
      ) : null}
    </View>
  );
}

function GanttRowBlock({
  row,
  minTime,
  maxTime,
}: {
  row: GanttRow;
  minTime: number;
  maxTime: number;
}) {
  if (row.slots.length === 0) return null;

  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        {row.subtitle ? (
          <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.timelineTrack}>
        {row.slots.map((slot) => (
          <GanttBar
            key={slot.id}
            slot={slot}
            minTime={minTime}
            maxTime={maxTime}
          />
        ))}
      </View>
    </View>
  );
}

function StatusLegendItem({
  borderColor,
  label,
}: {
  borderColor: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[styles.legendSwatchBorder, { borderColor }]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function GanttLegend({
  missionItems,
  showUnassigned,
  showOverdue,
}: {
  missionItems: GanttLegendItem[];
  showUnassigned: boolean;
  showOverdue: boolean;
}) {
  return (
    <View style={styles.legend}>
      {missionItems.map((item) => (
        <View key={item.id} style={styles.legendItem}>
          <View
            style={[styles.legendSwatch, { backgroundColor: item.color }]}
          />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
      {showUnassigned ? (
        <StatusLegendItem
          borderColor={GANTT_UNASSIGNED_BORDER}
          label="Sans bénévole"
        />
      ) : null}
      {showOverdue ? (
        <StatusLegendItem
          borderColor={GANTT_OVERDUE_BORDER}
          label="En retard"
        />
      ) : null}
    </View>
  );
}

export function GanttPdfDocument({
  title,
  dateLabel,
  festivalDateLabel,
  hourLabels,
  rows,
  showGroups,
  minTime,
  maxTime,
}: {
  title: string;
  dateLabel: string;
  festivalDateLabel?: string;
  hourLabels: string[];
  rows: GanttRow[];
  showGroups: boolean;
  minTime: number;
  maxTime: number;
}) {
  const subtitleParts = [dateLabel, festivalDateLabel].filter(Boolean);
  const subtitle = subtitleParts.join(" · ");
  const legendItems = extractGanttLegend(rows);
  const showUnassigned = ganttHasStatusIndicator(rows, "unassigned");
  const showOverdue = ganttHasStatusIndicator(rows, "overdue");

  const rowsWithHeaders = showGroups
    ? (() => {
        let previousGroup: string | undefined;
        return rows.map((row) => {
          const groupHeader =
            row.group && row.group !== previousGroup ? row.group : undefined;
          if (groupHeader) previousGroup = row.group;
          return { row, groupHeader };
        });
      })()
    : rows.map((row) => ({ row, groupHeader: undefined as string | undefined }));

  const visibleRows = rowsWithHeaders.filter(({ row }) => row.slots.length > 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {visibleRows.length === 0 ? (
          <Text style={styles.empty}>
            Aucune mission ce jour-là
          </Text>
        ) : (
          <>
            {hourLabels.length > 0 ? (
              <View style={styles.dayRow}>
                {hourLabels.map((label, i) => (
                  <Text key={`${label}-${i}`} style={styles.hourLabel}>
                    {label}
                  </Text>
                ))}
              </View>
            ) : null}

            {visibleRows.map(({ row, groupHeader }) => (
              <View key={row.id}>
                {groupHeader ? (
                  <Text style={styles.groupHeader}>{groupHeader}</Text>
                ) : null}
                <GanttRowBlock row={row} minTime={minTime} maxTime={maxTime} />
              </View>
            ))}

            <GanttLegend
              missionItems={legendItems}
              showUnassigned={showUnassigned}
              showOverdue={showOverdue}
            />
          </>
        )}
      </Page>
    </Document>
  );
}
