import sqlite3, json, csv
conn = sqlite3.connect('prisma/dev.db')
conn.row_factory = sqlite3.Row

# 1. Find User 801 Reddy
u = conn.execute("SELECT id, name, email, role, departmentId FROM User WHERE name = 'User 801 Reddy'").fetchone()
if not u:
    print("SUPERVISOR NOT FOUND")
    exit(1)

print("=== SUPERVISOR DETECTED ===")
print(dict(u))

dept_id = u['departmentId']
if dept_id:
    dept = conn.execute("SELECT id, name FROM Department WHERE id = ?", (dept_id,)).fetchone()
    print(f"\nDepartment: {dict(dept)}")
    print("\n=> DEPARTMENT SCOPING APPLIES. Can only see inspections in sites under this department.")
else:
    print("\n=> departmentId is NULL. scope() returns {} => can see ALL departments.")

# 2. Count inspections visible to this supervisor with AI data
if dept_id:
    count = conn.execute("""
        SELECT COUNT(*) FROM Inspection i 
        JOIN Site s ON s.id = i.siteId 
        WHERE s.departmentId = ? AND i.confidenceScore IS NOT NULL
    """, (dept_id,)).fetchone()[0]
    print(f"\nInspections with confidenceScore in this dept: {count}")
else:
    count = conn.execute("SELECT COUNT(*) FROM Inspection WHERE confidenceScore IS NOT NULL").fetchone()[0]
    print(f"\nInspections with confidenceScore (all depts): {count}")

# 3. Find inspections with ALL required AI data + reports
if dept_id:
    inspections = conn.execute("""
        SELECT i.id, i.status, i.confidenceScore, s.name as site_name, 
               (SELECT COUNT(*) FROM VerificationFinding vf WHERE vf.inspectionId = i.id) as findings_count,
               (SELECT COUNT(*) FROM InspectionChecklist ic WHERE ic.inspectionId = i.id) as checklists_count,
               (SELECT COUNT(*) FROM Report r WHERE r.inspectionId = i.id) as report_count
        FROM Inspection i
        JOIN Site s ON s.id = i.siteId
        WHERE s.departmentId = ? 
          AND i.confidenceScore IS NOT NULL
          AND EXISTS (SELECT 1 FROM VerificationFinding vf WHERE vf.inspectionId = i.id)
          AND EXISTS (SELECT 1 FROM InspectionChecklist ic WHERE ic.inspectionId = i.id)
        ORDER BY i.createdAt DESC
        LIMIT 15
    """, (dept_id,)).fetchall()
else:
    inspections = conn.execute("""
        SELECT i.id, i.status, i.confidenceScore, s.name as site_name,
               (SELECT COUNT(*) FROM VerificationFinding vf WHERE vf.inspectionId = i.id) as findings_count,
               (SELECT COUNT(*) FROM InspectionChecklist ic WHERE ic.inspectionId = i.id) as checklists_count,
               (SELECT COUNT(*) FROM Report r WHERE r.inspectionId = i.id) as report_count
        FROM Inspection i
        JOIN Site s ON s.id = i.siteId
        WHERE i.confidenceScore IS NOT NULL
          AND EXISTS (SELECT 1 FROM VerificationFinding vf WHERE vf.inspectionId = i.id)
          AND EXISTS (SELECT 1 FROM InspectionChecklist ic WHERE ic.inspectionId = i.id)
        ORDER BY i.createdAt DESC
        LIMIT 15
    """).fetchall()

print(f"\n=== CANDIDATE INSPECTIONS ({len(inspections)} found) ===")
print()
for idx, r in enumerate(inspections, 1):
    report_str = "YES" if r['report_count'] > 0 else "no"
    print(f"  {idx:2d}. ID: {r['id'][:8]}...")
    print(f"      Site: {r['site_name']}")
    print(f"      Status: {r['status']}")
    print(f"      AI Confidence: {r['confidenceScore']}%")
    print(f"      Findings: {r['findings_count']} | Checklists: {r['checklists_count']} | Report: {report_str}")
    print()

print("SUMMARY:")
print(f"  Supervisor: {u['name']} (ID: {u['id'][:8]}...)")
print(f"  Department scope: {'YES (dept: ' + dept['name'] + ')' if dept_id else 'NO (sees all)'}")
print(f"  Inspections to update: {len(inspections)}")
for r in inspections:
    print(f"    {r['status']:12s} -> SUBMITTED   | {r['site_name'][:30]:30s} | confidence={r['confidenceScore']}% | findings={r['findings_count']}")

conn.close()