/**
 * LogbookPDF.jsx — IAMS Official Logbook Document
 * ─────────────────────────────────────────────────────────────
 * Generates a professional, legally-formatted PDF logbook.
 * Designed to look like an official University of Botswana document —
 * not a screenshot of the web app.
 *
 * Install: npm install @react-pdf/renderer
 *
 * Exports:
 *   LogbookPDFDownload   — download button component
 *   LogbookPreviewModal  — in-browser preview modal
 *   useLogbookWeeks      — hook to fetch all weeks with daily_logs
 */

import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink, Line, Svg,
} from "@react-pdf/renderer";
import { useState, useEffect } from "react";
import { FileText, Loader2, Download, X, Eye } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { logbookService } from "../../../services/logbookService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtLong  = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDay   = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const statusLabel = (s) => ({
  approved:      "APPROVED",
  submitted:     "SUBMITTED — PENDING REVIEW",
  action_needed: "REVISION REQUIRED",
  draft:         "DRAFT",
}[s] ?? s.toUpperCase());

const docRef = (studentId, year) =>
  `UB/CS/IA/${year}/${(studentId || "000000").slice(-6)}`;

// ─── Stylesheet — clean official document aesthetic ───────────────────────────
const S = StyleSheet.create({

  // Pages
  page: {
    fontFamily:        "Helvetica",
    fontSize:          9,
    color:             "#1a1a1a",
    backgroundColor:   "#ffffff",
    paddingTop:        52,
    paddingBottom:     64,
    paddingHorizontal: 52,
    lineHeight:        1.4,
  },

  // ── Letterhead ──
  letterhead: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
    marginBottom:      6,
  },
  institutionBlock: { flex: 1 },
  institutionName: {
    fontSize:    14,
    fontFamily:  "Helvetica-Bold",
    color:       "#0b1d3a",
    marginBottom: 1,
  },
  institutionSub: {
    fontSize:  8,
    color:     "#444444",
    marginBottom: 1,
  },
  docRefBlock: { alignItems: "flex-end" },
  docRefLabel: {
    fontSize:  7,
    color:     "#666666",
    marginBottom: 1,
  },
  docRefValue: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
  },

  // ── Divider ──
  dividerThick: {
    borderBottomWidth: 2,
    borderBottomColor: "#0b1d3a",
    marginBottom:      10,
  },
  dividerThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    marginVertical:    8,
  },

  // ── Document title ──
  docTitleBlock: {
    alignItems:    "center",
    marginBottom:  14,
    marginTop:     4,
  },
  docTitle: {
    fontSize:    14,
    fontFamily:  "Helvetica-Bold",
    color:       "#0b1d3a",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom:  3,
  },
  docSubtitle: {
    fontSize:  8,
    color:     "#555555",
    letterSpacing: 0.5,
  },

  // ── Info table ──
  infoTable: {
    borderWidth:   1,
    borderColor:   "#cccccc",
    marginBottom:  16,
  },
  infoRow: {
    flexDirection:   "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
  },
  infoRowLast: {
    flexDirection: "row",
  },
  infoLabel: {
    width:           140,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#f5f5f5",
    borderRightWidth: 0.5,
    borderRightColor: "#cccccc",
    fontSize:        8,
    fontFamily:      "Helvetica-Bold",
    color:           "#333333",
  },
  infoValue: {
    flex:            1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize:        9,
    color:           "#1a1a1a",
  },

  // ── Section heading ──
  sectionHeading: {
    fontSize:        9,
    fontFamily:      "Helvetica-Bold",
    color:           "#ffffff",
    backgroundColor: "#0b1d3a",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom:    0,
    textTransform:   "uppercase",
    letterSpacing:   0.8,
  },

  // ── Week block ──
  weekBlock: {
    marginBottom: 20,
    borderWidth:  1,
    borderColor:  "#cccccc",
  },
  weekHeader: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingHorizontal: 8,
    paddingVertical:   5,
  },
  weekHeaderLeft: {},
  weekTitle: {
    fontSize:   10,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
  },
  weekPeriod: {
    fontSize: 8,
    color:    "#555555",
    marginTop: 1,
  },
  weekStatus: {
    fontSize:   7,
    fontFamily: "Helvetica-Bold",
    color:      "#555555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Log table ──
  tableHeader: {
    flexDirection:     "row",
    backgroundColor:   "#eeeeee",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  tableRow: {
    flexDirection:     "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    minHeight:         36,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight:     36,
  },
  colDay: {
    width:           56,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#cccccc",
  },
  colDate: {
    width:           54,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#cccccc",
  },
  colActivity: {
    flex:            1,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#cccccc",
  },
  colHours: {
    width:           38,
    paddingVertical: 4,
    paddingHorizontal: 5,
    alignItems:      "flex-end",
  },
  tableHeaderText: {
    fontSize:        7,
    fontFamily:      "Helvetica-Bold",
    color:           "#333333",
    textTransform:   "uppercase",
    letterSpacing:   0.3,
  },
  cellDayName: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a1a",
  },
  cellDate: {
    fontSize: 7,
    color:    "#666666",
    marginTop: 1,
  },
  cellContent: {
    fontSize:   8,
    color:      "#1a1a1a",
    lineHeight: 1.5,
  },
  cellEmpty: {
    fontSize:  8,
    color:     "#aaaaaa",
    fontFamily: "Helvetica-Oblique",
  },
  cellHours: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
  },

  // ── Sub-fields in activity cell ──
  fieldLabel: {
    fontSize:    7,
    fontFamily:  "Helvetica-Bold",
    color:       "#555555",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginTop:   3,
    marginBottom: 1,
  },
  fieldText: {
    fontSize:   8,
    color:      "#1a1a1a",
    lineHeight: 1.5,
  },

  // ── Weekly totals row ──
  totalsRow: {
    flexDirection:     "row",
    backgroundColor:   "#f9f9f9",
    borderTopWidth:    1,
    borderTopColor:    "#cccccc",
    paddingVertical:   4,
    paddingHorizontal: 8,
    justifyContent:    "flex-end",
    alignItems:        "center",
    gap:               16,
  },
  totalsLabel: {
    fontSize:  8,
    color:     "#555555",
  },
  totalsValue: {
    fontSize:   9,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
  },

  // ── Reflection box ──
  reflectionBox: {
    borderTopWidth:    0.5,
    borderTopColor:    "#cccccc",
    paddingVertical:   6,
    paddingHorizontal: 8,
    backgroundColor:   "#fafafa",
  },
  reflectionLabel: {
    fontSize:    7,
    fontFamily:  "Helvetica-Bold",
    color:       "#333333",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom:  3,
  },
  reflectionText: {
    fontSize:  8,
    color:     "#1a1a1a",
    lineHeight: 1.6,
  },

  // ── Feedback box ──
  feedbackBox: {
    borderTopWidth:    1,
    borderTopColor:    "#cc0000",
    paddingVertical:   6,
    paddingHorizontal: 8,
    backgroundColor:   "#fff8f8",
  },
  feedbackLabel: {
    fontSize:    7,
    fontFamily:  "Helvetica-Bold",
    color:       "#cc0000",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom:  3,
  },
  feedbackText: {
    fontSize:  8,
    color:     "#660000",
    lineHeight: 1.6,
  },

  // ── Supervisor signature block (per week) ──
  signatureBlock: {
    borderTopWidth:    1,
    borderTopColor:    "#cccccc",
    paddingVertical:   8,
    paddingHorizontal: 8,
    backgroundColor:   "#f9fff9",
    flexDirection:     "row",
    alignItems:        "flex-start",
    gap:               16,
  },
  stampCircle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    borderWidth:     2,
    borderColor:     "#007a3d",
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: "#f0fff4",
    flexShrink:      0,
  },
  stampCircleText: {
    fontSize:    7,
    fontFamily:  "Helvetica-Bold",
    color:       "#007a3d",
    textAlign:   "center",
    lineHeight:  1.3,
  },
  signatureInfo: { flex: 1 },
  signatureApprovedTag: {
    fontSize:      7,
    fontFamily:    "Helvetica-Bold",
    color:         "#007a3d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom:  2,
  },
  signatureName: {
    fontSize:   10,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
    marginBottom: 1,
  },
  signatureTitle: {
    fontSize:  8,
    color:     "#444444",
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#aaaaaa",
    marginBottom:      2,
    width:             160,
  },
  signatureDate: {
    fontSize: 7,
    color:    "#666666",
  },
  signatureVerified: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    marginTop:     4,
  },
  signatureVerifiedDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: "#007a3d",
  },
  signatureVerifiedText: {
    fontSize:  7,
    color:     "#007a3d",
    fontFamily: "Helvetica-Bold",
  },

  // ── Summary table ──
  summaryTableHeader: {
    flexDirection:     "row",
    backgroundColor:   "#0b1d3a",
    paddingVertical:   5,
    paddingHorizontal: 8,
  },
  summaryTableHeaderText: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#ffffff",
    flex:       1,
  },
  summaryTableRow: {
    flexDirection:     "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical:   5,
    paddingHorizontal: 8,
  },
  summaryTableRowAlt: {
    flexDirection:     "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical:   5,
    paddingHorizontal: 8,
    backgroundColor:   "#f9f9f9",
  },
  summaryCell: {
    flex:    1,
    fontSize: 8,
    color:   "#1a1a1a",
  },
  summaryCellBold: {
    flex:       1,
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#0b1d3a",
  },

  // ── Declaration / certification ──
  declarationBox: {
    borderWidth:       1,
    borderColor:       "#cccccc",
    paddingVertical:   12,
    paddingHorizontal: 14,
    marginBottom:      16,
    backgroundColor:   "#fafafa",
  },
  declarationTitle: {
    fontSize:    10,
    fontFamily:  "Helvetica-Bold",
    color:       "#0b1d3a",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  declarationText: {
    fontSize:  8,
    color:     "#333333",
    lineHeight: 1.7,
    marginBottom: 6,
  },

  // ── Signature line (certification page) ──
  sigLine: {
    marginTop:    24,
    paddingTop:   0,
  },
  sigLineLabel: {
    fontSize:  7,
    color:     "#555555",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom:  2,
  },
  sigLineRule: {
    borderBottomWidth: 1,
    borderBottomColor: "#555555",
    marginBottom:      2,
    width:             220,
  },
  sigLineName: {
    fontSize:  8,
    color:     "#333333",
  },
  sigLineTitle: {
    fontSize: 7,
    color:    "#666666",
  },

  // ── Footer ──
  footer: {
    position:          "absolute",
    bottom:            28,
    left:              52,
    right:             52,
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "center",
    borderTopWidth:    0.5,
    borderTopColor:    "#cccccc",
    paddingTop:        6,
  },
  footerText: {
    fontSize: 7,
    color:    "#888888",
  },
  footerCenter: {
    fontSize:  7,
    color:     "#888888",
    textAlign: "center",
  },

  // ── CONFIDENTIAL watermark band ──
  confidentialBand: {
    backgroundColor: "#f5f5f5",
    borderTopWidth:  0.5,
    borderTopColor:  "#cccccc",
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom:    10,
    flexDirection:   "row",
    justifyContent:  "center",
  },
  confidentialText: {
    fontSize:      7,
    color:         "#aaaaaa",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});

// ─── Shared letterhead component ──────────────────────────────────────────────
function Letterhead({ student, placement, docRef: ref, year }) {
  const org = placement?.organization_profiles;
  return (
    <>
      <View style={S.letterhead}>
        <View style={S.institutionBlock}>
          <Text style={S.institutionName}>UNIVERSITY OF BOTSWANA</Text>
          <Text style={S.institutionSub}>Department of Computer Science</Text>
          <Text style={S.institutionSub}>Industrial Attachment Programme</Text>
          <Text style={S.institutionSub}>Private Bag UB 0022, Gaborone, Botswana</Text>
        </View>
        <View style={S.docRefBlock}>
          <Text style={S.docRefLabel}>Document Reference</Text>
          <Text style={S.docRefValue}>{ref}</Text>
          <Text style={[S.docRefLabel, { marginTop: 6 }]}>Academic Year</Text>
          <Text style={S.docRefValue}>{year}</Text>
          <Text style={[S.docRefLabel, { marginTop: 6 }]}>Date Generated</Text>
          <Text style={S.docRefValue}>{fmtLong(new Date())}</Text>
        </View>
      </View>
      <View style={S.dividerThick} />
    </>
  );
}

// ─── Week page ────────────────────────────────────────────────────────────────
function WeekPage({ week, weekIndex, student, placement, weekRef, year }) {
  const org    = placement?.organization_profiles;
  const logs   = week.daily_logs || [];
  const totalH = logs.reduce((a, d) => a + (parseFloat(d.hours_worked) || 0), 0);
  const isApproved = week.status === "approved";
  const ref = weekRef;

  return (
    <Page size="A4" style={S.page}>
      <Letterhead student={student} placement={placement} docRef={ref} year={year} />

      {/* Week title */}
      <View style={S.docTitleBlock}>
        <Text style={S.docTitle}>Industrial Attachment Logbook</Text>
        <Text style={S.docSubtitle}>
          Week {week.week_number} of {placement?.duration_weeks ?? "—"} —{" "}
          {fmtShort(week.start_date)} to {fmtShort(week.end_date)}
        </Text>
      </View>

      {/* Student & placement summary row */}
      <View style={[S.infoTable, { marginBottom: 12 }]}>
        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Student Name</Text>
          <Text style={[S.infoValue, { flex: 1 }]}>{student?.full_name ?? "—"}</Text>
          <Text style={[S.infoLabel, { borderLeftWidth: 0.5, borderLeftColor: "#cccccc" }]}>Student ID</Text>
          <Text style={[S.infoValue, { width: 100 }]}>{student?.student_id ?? "—"}</Text>
        </View>
        <View style={S.infoRowLast}>
          <Text style={S.infoLabel}>Host Organisation</Text>
          <Text style={[S.infoValue, { flex: 1 }]}>{org?.org_name ?? "—"}</Text>
          <Text style={[S.infoLabel, { borderLeftWidth: 0.5, borderLeftColor: "#cccccc" }]}>Week Status</Text>
          <Text style={[S.infoValue, { width: 100, fontFamily: isApproved ? "Helvetica-Bold" : "Helvetica", color: isApproved ? "#007a3d" : "#333333" }]}>
            {statusLabel(week.status)}
          </Text>
        </View>
      </View>

      {/* Daily log table */}
      <Text style={S.sectionHeading}>Daily Activity Log</Text>
      <View style={S.weekBlock}>
        {/* Table header */}
        <View style={S.tableHeader}>
          <View style={S.colDay}><Text style={S.tableHeaderText}>Day</Text></View>
          <View style={S.colDate}><Text style={S.tableHeaderText}>Date</Text></View>
          <View style={S.colActivity}><Text style={S.tableHeaderText}>Activities / Tasks / Learning</Text></View>
          <View style={S.colHours}><Text style={S.tableHeaderText}>Hrs</Text></View>
        </View>

        {/* Daily rows */}
        {logs.map((log, i) => {
          const isLast     = i === logs.length - 1;
          const RowStyle   = isLast ? S.tableRowLast : S.tableRow;
          const hasContent = log.activity_details?.trim() || log.tasks_completed?.trim() ||
                             log.learning_outcomes?.trim() || log.challenges?.trim();

          return (
            <View key={log.id} style={RowStyle}>
              <View style={S.colDay}>
                <Text style={S.cellDayName}>{(log.day_of_week || "").slice(0, 3)}</Text>
                <Text style={S.cellDate}>{fmtDay(log.log_date)}</Text>
              </View>
              <View style={S.colDate}>
                <Text style={S.cellDate}>{fmtLong(log.log_date)}</Text>
              </View>
              <View style={S.colActivity}>
                {!hasContent ? (
                  <Text style={S.cellEmpty}>No entry recorded.</Text>
                ) : (
                  <>
                    {log.activity_details?.trim() ? (
                      <>
                        <Text style={S.fieldLabel}>Activities</Text>
                        <Text style={S.fieldText}>{log.activity_details.trim()}</Text>
                      </>
                    ) : null}
                    {log.tasks_completed?.trim() ? (
                      <>
                        <Text style={S.fieldLabel}>Tasks Completed</Text>
                        <Text style={S.fieldText}>{log.tasks_completed.trim()}</Text>
                      </>
                    ) : null}
                    {log.learning_outcomes?.trim() ? (
                      <>
                        <Text style={S.fieldLabel}>Learning Outcomes</Text>
                        <Text style={S.fieldText}>{log.learning_outcomes.trim()}</Text>
                      </>
                    ) : null}
                    {log.challenges?.trim() ? (
                      <>
                        <Text style={S.fieldLabel}>Challenges</Text>
                        <Text style={S.fieldText}>{log.challenges.trim()}</Text>
                      </>
                    ) : null}
                  </>
                )}
              </View>
              <View style={S.colHours}>
                <Text style={S.cellHours}>{log.hours_worked ?? 0}</Text>
              </View>
            </View>
          );
        })}

        {/* Totals row */}
        <View style={S.totalsRow}>
          <Text style={S.totalsLabel}>Total Hours This Week:</Text>
          <Text style={S.totalsValue}>{totalH.toFixed(1)} hours</Text>
        </View>

        {/* Weekly reflection */}
        {week.student_summary?.trim() && (
          <View style={S.reflectionBox}>
            <Text style={S.reflectionLabel}>Weekly Reflection / Summary</Text>
            <Text style={S.reflectionText}>{week.student_summary.trim()}</Text>
          </View>
        )}

        {/* Supervisor feedback (action needed) */}
        {week.supervisor_comments?.trim() && week.status === "action_needed" && (
          <View style={S.feedbackBox}>
            <Text style={S.feedbackLabel}>Supervisor Feedback — Revision Required</Text>
            <Text style={S.feedbackText}>{week.supervisor_comments.trim()}</Text>
          </View>
        )}

        {/* Digital approval stamp — approved weeks only */}
        {isApproved && week.stamped_by_name && (
          <View style={S.signatureBlock}>
            {/* Official circular stamp */}
            <View style={S.stampCircle}>
              <Text style={S.stampCircleText}>{"OFFICIALLY\nAPPROVED\nIAMS"}</Text>
            </View>

            <View style={S.signatureInfo}>
              <Text style={S.signatureApprovedTag}>✓  Digitally Approved by Industrial Supervisor</Text>
              <Text style={S.signatureName}>{week.stamped_by_name}</Text>
              {week.stamped_by_title ? (
                <Text style={S.signatureTitle}>{week.stamped_by_title}</Text>
              ) : null}
              {/* Signature line */}
              <View style={S.signatureLine} />
              <Text style={S.signatureDate}>Date of Approval: {fmtLong(week.approved_at)}</Text>
              <View style={S.signatureVerified}>
                <View style={S.signatureVerifiedDot} />
                <Text style={S.signatureVerifiedText}>
                  Digitally recorded in IAMS — Ref: {docRef}-W{week.week_number}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Page footer */}
      <View style={S.footer} fixed>
        <Text style={S.footerText}>{student?.full_name} · {student?.student_id}</Text>
        <Text style={S.footerCenter}>CONFIDENTIAL — University of Botswana Industrial Attachment</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Cover + summary page ─────────────────────────────────────────────────────
function CoverPage({ student, placement, weeks }) {
  const org        = placement?.organization_profiles;
  const year       = new Date().getFullYear();
  const ref        = docRef(student?.student_id, year);
  const totalH     = weeks.reduce((a, w) =>
    a + (w.daily_logs || []).reduce((b, d) => b + (parseFloat(d.hours_worked) || 0), 0), 0);
  const approved   = weeks.filter(w => w.status === "approved").length;
  const submitted  = weeks.filter(w => w.status === "submitted").length;
  const total      = placement?.duration_weeks ?? weeks.length;

  return (
    <Page size="A4" style={S.page}>
      <Letterhead student={student} placement={placement} docRef={ref} year={year} />

      {/* Document title */}
      <View style={S.docTitleBlock}>
        <Text style={S.docTitle}>Industrial Attachment Logbook</Text>
        <Text style={S.docSubtitle}>Official Record of Industrial Attachment — CSI341</Text>
      </View>

      {/* Confidential band */}
      <View style={S.confidentialBand}>
        <Text style={S.confidentialText}>Confidential — For Official Use Only</Text>
      </View>

      {/* Student particulars */}
      <Text style={[S.sectionHeading, { marginBottom: 0 }]}>Student Particulars</Text>
      <View style={[S.infoTable, { marginBottom: 14 }]}>
        {[
          ["Full Name",             student?.full_name ?? "—"],
          ["Student ID Number",     student?.student_id ?? "—"],
          ["Programme",             "BSc Computer Science"],
          ["Academic Year",         `${year}`],
        ].map(([label, value], i, arr) => (
          <View key={label} style={i === arr.length - 1 ? S.infoRowLast : S.infoRow}>
            <Text style={S.infoLabel}>{label}</Text>
            <Text style={S.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Placement details */}
      <Text style={[S.sectionHeading, { marginBottom: 0 }]}>Placement Details</Text>
      <View style={[S.infoTable, { marginBottom: 14 }]}>
        {[
          ["Host Organisation",     org?.org_name ?? "—"],
          ["Location",              org?.location ?? "—"],
          ["Position / Role",       placement?.position_title ?? "—"],
          ["Start Date",            fmtShort(placement?.start_date)],
          ["End Date",              fmtShort(placement?.end_date)],
          ["Duration",              `${total} weeks`],
          ["Industrial Supervisor", placement?.industrial_supervisor_name ?? "—"],
          ["University Supervisor", placement?.university_supervisor_name ?? "—"],
        ].map(([label, value], i, arr) => (
          <View key={label} style={i === arr.length - 1 ? S.infoRowLast : S.infoRow}>
            <Text style={S.infoLabel}>{label}</Text>
            <Text style={S.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Logbook summary */}
      <Text style={[S.sectionHeading, { marginBottom: 0 }]}>Logbook Summary</Text>
      <View style={S.infoTable}>
        <View style={S.summaryTableHeader}>
          {["Week", "Period", "Status", "Hrs", "Approved By"].map(h => (
            <Text key={h} style={S.summaryTableHeaderText}>{h}</Text>
          ))}
        </View>
        {weeks.map((w, i) => {
          const hrs = (w.daily_logs || []).reduce((a, d) => a + (parseFloat(d.hours_worked) || 0), 0);
          const RowStyle = i % 2 === 0 ? S.summaryTableRow : S.summaryTableRowAlt;
          return (
            <View key={w.id} style={RowStyle}>
              <Text style={S.summaryCell}>Week {w.week_number}</Text>
              <Text style={S.summaryCell}>{fmtShort(w.start_date)} – {fmtShort(w.end_date)}</Text>
              <Text style={[S.summaryCell, w.status === "approved" ? { color: "#007a3d", fontFamily: "Helvetica-Bold" } : {}]}>
                {statusLabel(w.status)}
              </Text>
              <Text style={S.summaryCell}>{hrs.toFixed(1)}</Text>
              <Text style={S.summaryCell}>{w.stamped_by_name ?? "—"}</Text>
            </View>
          );
        })}
        {/* Totals */}
        <View style={[S.summaryTableRow, { backgroundColor: "#f0f0f0" }]}>
          <Text style={S.summaryCellBold}>TOTAL</Text>
          <Text style={S.summaryCell}>{total} weeks</Text>
          <Text style={S.summaryCell}>{approved} approved / {submitted} pending</Text>
          <Text style={S.summaryCellBold}>{totalH.toFixed(1)}</Text>
          <Text style={S.summaryCell} />
        </View>
      </View>

      <View style={S.footer} fixed>
        <Text style={S.footerText}>Ref: {ref}</Text>
        <Text style={S.footerCenter}>CONFIDENTIAL — University of Botswana Industrial Attachment</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Certification page ───────────────────────────────────────────────────────
function CertificationPage({ student, placement, weeks }) {
  const org      = placement?.organization_profiles;
  const year     = new Date().getFullYear();
  const ref      = docRef(student?.student_id, year);  const approved = weeks.filter(w => w.status === "approved").length;
  const total    = placement?.duration_weeks ?? weeks.length;

  return (
    <Page size="A4" style={S.page}>
      <Letterhead student={student} placement={placement} docRef={ref} year={year} />

      <View style={S.docTitleBlock}>
        <Text style={S.docTitle}>Certification of Completion</Text>
        <Text style={S.docSubtitle}>Industrial Attachment Logbook — Official Declaration</Text>
      </View>

      {/* Student declaration */}
      <View style={S.declarationBox}>
        <Text style={S.declarationTitle}>Student Declaration</Text>
        <Text style={S.declarationText}>
          I, {student?.full_name ?? "___________________"} (Student ID: {student?.student_id ?? "___________________"}),
          hereby declare that the entries contained in this Industrial Attachment Logbook are a true and accurate
          record of the work performed during my industrial attachment at {org?.org_name ?? "___________________"}
          from {fmtLong(placement?.start_date)} to {fmtLong(placement?.end_date)}.
        </Text>
        <Text style={S.declarationText}>
          I acknowledge that this logbook is an official academic document submitted in partial fulfilment of the
          requirements of the Department of Computer Science programme at the University of Botswana.
          Any misrepresentation of information in this document constitutes academic dishonesty.
        </Text>
        <Text style={S.declarationText}>
          Logbook Statistics: {total} weeks total · {approved} weeks approved by industrial supervisor ·{" "}
          {weeks.filter(w => w.status !== "draft").length} weeks submitted
        </Text>

        <View style={S.sigLine}>
          <Text style={S.sigLineLabel}>Student Signature</Text>
          <View style={S.sigLineRule} />
          <Text style={S.sigLineName}>{student?.full_name ?? "___________________"}</Text>
          <Text style={S.sigLineTitle}>{student?.student_id ?? ""}</Text>
        </View>

        <View style={[S.sigLine, { marginTop: 12 }]}>
          <Text style={S.sigLineLabel}>Date Signed</Text>
          <View style={S.sigLineRule} />
        </View>
      </View>

      {/* Industrial supervisor certification */}
      <View style={[S.declarationBox, { marginBottom: 12 }]}>
        <Text style={S.declarationTitle}>Industrial Supervisor Certification</Text>
        <Text style={S.declarationText}>
          I certify that I have reviewed the logbook entries for the above-named student during their
          industrial attachment at {org?.org_name ?? "___________________"} and that the entries
          accurately reflect the work performed under my supervision.
        </Text>

        <View style={S.sigLine}>
          <Text style={S.sigLineLabel}>Industrial Supervisor Signature</Text>
          <View style={S.sigLineRule} />
          <Text style={S.sigLineName}>{placement?.industrial_supervisor_name ?? "___________________"}</Text>
          <Text style={S.sigLineTitle}>Industrial Supervisor · {org?.org_name ?? ""}</Text>
        </View>

        <View style={[S.sigLine, { marginTop: 12 }]}>
          <Text style={S.sigLineLabel}>Official Company Stamp</Text>
          <View style={[S.sigLineRule, { width: 120, height: 60, borderBottomWidth: 0, borderWidth: 1, borderColor: "#aaaaaa" }]} />
        </View>

        <View style={[S.sigLine, { marginTop: 12 }]}>
          <Text style={S.sigLineLabel}>Date</Text>
          <View style={S.sigLineRule} />
        </View>
      </View>

      {/* University supervisor section */}
      <View style={[S.declarationBox, { marginBottom: 12 }]}>
        <Text style={S.declarationTitle}>University Supervisor Endorsement</Text>
        <Text style={S.declarationText}>
          I confirm that I have conducted the required site visits and reviewed this logbook
          as the assigned university supervisor for this student.
        </Text>

        <View style={S.sigLine}>
          <Text style={S.sigLineLabel}>University Supervisor Signature</Text>
          <View style={S.sigLineRule} />
          <Text style={S.sigLineName}>{placement?.university_supervisor_name ?? "___________________"}</Text>
          <Text style={S.sigLineTitle}>University Supervisor · Department of Computer Science, UB</Text>
        </View>

        <View style={[S.sigLine, { marginTop: 12 }]}>
          <Text style={S.sigLineLabel}>Date</Text>
          <View style={S.sigLineRule} />
        </View>
      </View>

      {/* IAMS digital record notice */}
      <View style={S.confidentialBand}>
        <Text style={S.confidentialText}>
          This document was generated by IAMS · Ref: {ref} · {fmtLong(new Date())} · University of Botswana
        </Text>
      </View>

      <View style={S.footer} fixed>
        <Text style={S.footerText}>Ref: {ref}</Text>
        <Text style={S.footerCenter}>CONFIDENTIAL — University of Botswana Industrial Attachment</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────
function LogbookDocument({ student, placement, weeks }) {
  const year = new Date().getFullYear();
  const ref  = docRef(student?.student_id, year);

  return (
    <Document
      title={`IAMS Logbook — ${student?.full_name ?? "Student"} — ${year}`}
      author="IAMS — University of Botswana"
      subject="Industrial Attachment Logbook"
      keywords="industrial attachment logbook UB IAMS"
      creator="IAMS"
    >
      {/* 1. Cover + summary */}
      <CoverPage student={student} placement={placement} weeks={weeks} />

      {/* 2. One page per week */}
      {weeks.map((week, i) => (
        <WeekPage
          key={week.id}
          week={week}
          weekIndex={i}
          student={student}
          placement={placement}
          weekRef={ref}
          year={year}
        />
      ))}

      {/* 3. Certification / signature page */}
      <CertificationPage student={student} placement={placement} weeks={weeks} />
    </Document>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────
export function LogbookPDFDownload({ student, placement, weeks = [], loading: weeksLoading }) {
  const fileName = `IAMS_Logbook_${student?.student_id ?? "student"}_${new Date().getFullYear()}.pdf`;

  if (weeksLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400
          font-black text-xs rounded-xl uppercase tracking-wider cursor-not-allowed"
      >
        <Loader2 size={13} className="animate-spin" /> Preparing PDF…
      </button>
    );
  }

  if (!weeks.length) return null;

  return (
    <PDFDownloadLink
      document={<LogbookDocument student={student} placement={placement} weeks={weeks} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
            text-white font-black text-xs rounded-xl transition-all
            disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider
            shadow-lg shadow-brand-600/25"
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
            : <><Download size={13} /> Export Official PDF</>
          }
        </button>
      )}
    </PDFDownloadLink>
  );
}

// ─── Hook: fetch all weeks with daily_logs ────────────────────────────────────
export function useLogbookWeeks(placement) {
  const [weeks,   setWeeks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!placement?.id) return;

    let alive = true;
    const fetchWeeks = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: weekRows, error: wErr } = await supabase
          .from("logbook_weeks")
          .select("id, week_number, status")
          .eq("placement_id", placement.id)
          .order("week_number", { ascending: true });

        if (wErr) throw wErr;
        if (!weekRows?.length) { if (alive) setWeeks([]); return; }

        const full = await Promise.all(
          weekRows.map(w => logbookService.getWeekDetails(w.id))
        );
        if (alive) setWeeks(full);
      } catch (e) {
        if (alive) setError(e.message || "Failed to load logbook weeks.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchWeeks();
    return () => { alive = false; };
  }, [placement?.id]);

  return { weeks, loading, error };
}

// ─── Preview modal ────────────────────────────────────────────────────────────
export function LogbookPreviewModal({ student, placement, onClose }) {
  const { weeks, loading, error } = useLogbookWeeks(placement);
  const org = placement?.organization_profiles;

  const fmtP = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const fmtPShort = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";

  return (
    <div
      className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-50
        flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[94vh]
        flex flex-col shadow-2xl overflow-hidden border border-gray-200">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-brand-600" />
            <div>
              <h2 className="font-bold text-brand-900 text-sm">
                Industrial Attachment Logbook — Preview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {student?.full_name} · {org?.org_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loading && weeks.length > 0 && (
              <LogbookPDFDownload
                student={student}
                placement={placement}
                weeks={weeks}
                loading={loading}
              />
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100
                hover:text-brand-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document preview — styled like actual paper */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-brand-500" size={24} />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading logbook…</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && weeks.length === 0 && (
            <div className="text-center py-20">
              <FileText size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No logbook entries yet</p>
            </div>
          )}

          {/* Paper-style document preview */}
          {!loading && weeks.length > 0 && (
            <>
              {/* Cover page preview */}
              <div className="bg-white shadow-lg mx-auto max-w-2xl p-10 font-mono text-xs" style={{ fontFamily: "Georgia, serif" }}>
                {/* Letterhead */}
                <div className="border-b-2 border-gray-900 pb-3 mb-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">UNIVERSITY OF BOTSWANA</p>
                      <p className="text-xs text-gray-600">Department of Computer Science</p>
                      <p className="text-xs text-gray-600">Industrial Attachment Programme</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Ref: {docRef(student?.student_id, new Date().getFullYear())}</p>
                      <p>Generated: {fmtP(new Date())}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-base font-bold tracking-widest text-gray-900 uppercase mb-1">
                    Industrial Attachment Logbook
                  </p>
                  <p className="text-xs text-gray-500">Official Record of Industrial Attachment</p>
                </div>

                <div className="border border-gray-300 text-xs mb-4">
                  {[
                    ["Student Name",       student?.full_name],
                    ["Student ID",         student?.student_id],
                    ["Host Organisation",  org?.org_name],
                    ["Location",           org?.location],
                    ["Position",           placement?.position_title],
                    ["Period",             `${fmtP(placement?.start_date)} – ${fmtP(placement?.end_date)}`],
                    ["Duration",           `${placement?.duration_weeks} weeks`],
                    ["Ind. Supervisor",    placement?.industrial_supervisor_name],
                    ["Uni. Supervisor",    placement?.university_supervisor_name],
                  ].map(([label, value], i, arr) => (
                    <div key={label} className={`flex border-b ${i === arr.length - 1 ? "border-0" : "border-gray-200"}`}>
                      <div className="w-36 px-2 py-1.5 bg-gray-50 border-r border-gray-200 font-bold text-gray-700 shrink-0">
                        {label}
                      </div>
                      <div className="px-2 py-1.5 text-gray-900">{value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Week summary table */}
                <div className="border border-gray-300 text-xs">
                  <div className="flex bg-gray-900 text-white">
                    {["Week", "Period", "Status", "Hours"].map(h => (
                      <div key={h} className="flex-1 px-2 py-1.5 font-bold">{h}</div>
                    ))}
                  </div>
                  {weeks.map((w, i) => {
                    const hrs = (w.daily_logs || []).reduce((a, d) => a + (parseFloat(d.hours_worked) || 0), 0);
                    return (
                      <div key={w.id} className={`flex border-t border-gray-200 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                        <div className="flex-1 px-2 py-1.5">Week {w.week_number}</div>
                        <div className="flex-1 px-2 py-1.5">{fmtPShort(w.start_date)} – {fmtPShort(w.end_date)}</div>
                        <div className={`flex-1 px-2 py-1.5 font-bold ${w.status === "approved" ? "text-green-700" : "text-gray-600"}`}>
                          {statusLabel(w.status)}
                        </div>
                        <div className="flex-1 px-2 py-1.5">{hrs.toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Week pages preview */}
              {weeks.map(week => {
                const logs    = week.daily_logs || [];
                const totalH  = logs.reduce((a, d) => a + (parseFloat(d.hours_worked) || 0), 0);
                const isApproved = week.status === "approved";

                return (
                  <div key={week.id} className="bg-white shadow-lg mx-auto max-w-2xl p-10" style={{ fontFamily: "Georgia, serif" }}>
                    {/* Letterhead */}
                    <div className="border-b-2 border-gray-900 pb-3 mb-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">UNIVERSITY OF BOTSWANA</p>
                          <p className="text-xs text-gray-500">Department of Computer Science · Industrial Attachment</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{student?.full_name} · {student?.student_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm font-bold tracking-widest text-gray-900 uppercase">
                        Week {week.week_number} — Daily Activity Log
                      </p>
                      <p className="text-xs text-gray-500">
                        {fmtP(week.start_date)} to {fmtP(week.end_date)} · {org?.org_name}
                      </p>
                    </div>

                    {/* Table */}
                    <div className="border border-gray-300 text-xs mb-4">
                      <div className="flex bg-gray-800 text-white font-bold">
                        <div className="w-16 px-2 py-1.5 border-r border-gray-600 shrink-0">Day</div>
                        <div className="flex-1 px-2 py-1.5 border-r border-gray-600">Activities / Tasks / Learning</div>
                        <div className="w-10 px-2 py-1.5 shrink-0">Hrs</div>
                      </div>
                      {logs.map((log, i) => {
                        const hasContent = log.activity_details?.trim() || log.tasks_completed?.trim() ||
                          log.learning_outcomes?.trim() || log.challenges?.trim();
                        return (
                          <div key={log.id} className={`flex border-t border-gray-200 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                            <div className="w-16 px-2 py-2 border-r border-gray-200 shrink-0">
                              <p className="font-bold text-gray-800">{(log.day_of_week || "").slice(0, 3)}</p>
                              <p className="text-gray-500">{fmtPShort(log.log_date)}</p>
                            </div>
                            <div className="flex-1 px-2 py-2 border-r border-gray-200">
                              {!hasContent ? (
                                <p className="text-gray-400 italic">No entry recorded.</p>
                              ) : (
                                <div className="space-y-1">
                                  {log.activity_details?.trim() && <p><span className="font-bold text-gray-600">Activities: </span>{log.activity_details.trim()}</p>}
                                  {log.tasks_completed?.trim() && <p><span className="font-bold text-gray-600">Tasks: </span>{log.tasks_completed.trim()}</p>}
                                  {log.learning_outcomes?.trim() && <p><span className="font-bold text-gray-600">Learning: </span>{log.learning_outcomes.trim()}</p>}
                                  {log.challenges?.trim() && <p><span className="font-bold text-gray-600">Challenges: </span>{log.challenges.trim()}</p>}
                                </div>
                              )}
                            </div>
                            <div className="w-10 px-2 py-2 text-center font-bold text-gray-800 shrink-0">
                              {log.hours_worked ?? 0}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex border-t border-gray-400 bg-gray-100 font-bold">
                        <div className="w-16 px-2 py-1.5 border-r border-gray-300 shrink-0" />
                        <div className="flex-1 px-2 py-1.5 border-r border-gray-300 text-right text-gray-700">
                          Total Hours This Week:
                        </div>
                        <div className="w-10 px-2 py-1.5 text-center text-gray-900 shrink-0">
                          {totalH.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Reflection */}
                    {week.student_summary?.trim() && (
                      <div className="border-l-4 border-gray-400 pl-3 mb-4 text-xs">
                        <p className="font-bold text-gray-700 uppercase tracking-wide mb-1">Weekly Reflection</p>
                        <p className="text-gray-800 leading-relaxed">{week.student_summary.trim()}</p>
                      </div>
                    )}

                    {/* Supervisor feedback */}
                    {week.supervisor_comments?.trim() && week.status === "action_needed" && (
                      <div className="border-l-4 border-red-500 pl-3 mb-4 text-xs bg-red-50 py-2">
                        <p className="font-bold text-red-700 uppercase tracking-wide mb-1">Supervisor Feedback</p>
                        <p className="text-red-800 leading-relaxed">{week.supervisor_comments.trim()}</p>
                      </div>
                    )}

                    {/* Approval stamp */}
                    {isApproved && week.stamped_by_name && (
                      <div className="border border-green-300 bg-green-50 p-4 flex items-start gap-4">
                        {/* Official stamp circle */}
                        <div className="w-16 h-16 rounded-full border-2 border-green-700 flex items-center justify-center shrink-0 bg-white">
                          <div className="text-center">
                            <p className="text-[7px] font-bold text-green-700 leading-tight">OFFICIALLY</p>
                            <p className="text-[7px] font-bold text-green-700 leading-tight">APPROVED</p>
                            <p className="text-[7px] font-bold text-green-700 leading-tight">IAMS</p>
                          </div>
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-green-700 uppercase tracking-wide text-[10px] mb-1">
                            ✓ Digitally Approved by Industrial Supervisor
                          </p>
                          <p className="font-bold text-gray-900 text-sm">{week.stamped_by_name}</p>
                          {week.stamped_by_title && <p className="text-gray-600">{week.stamped_by_title}</p>}
                          <div className="border-b border-gray-400 w-40 my-2" />
                          <p className="text-gray-600">Date of Approval: {fmtP(week.approved_at)}</p>
                          <p className="text-green-600 text-[10px] mt-1">
                            Digitally recorded in IAMS · Ref: {docRef(student?.student_id, new Date().getFullYear())}-W{week.week_number}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}