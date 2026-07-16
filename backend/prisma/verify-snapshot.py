import sqlite3, json

conn = sqlite3.connect('prisma/dev.db')
snapshot = json.load(open('prisma/temp-queue-snapshot.json'))

print(f'📋 Verifying {len(snapshot)} inspections from snapshot...\n')

success = 0
fail = 0

for item in snapshot:
    row = conn.execute('''
        SELECT i.status, i.confidenceScore,
               (SELECT COUNT(*) FROM VerificationFinding vf WHERE vf.inspectionId = i.id) as findings,
               (SELECT COUNT(*) FROM InspectionChecklist ic WHERE ic.inspectionId = i.id) as checklists
        FROM Inspection i WHERE i.id = ?
    ''', (item['id'],)).fetchone()
    
    if row is None:
        print(f'   ✗ {item["id"][:8]}... NOT FOUND')
        fail += 1
    elif row[0] != 'SUBMITTED':
        print(f'   ✗ {item["id"][:8]}... status={row[0]} (expected SUBMITTED)')
        fail += 1
    elif row[1] is None:
        print(f'   ✗ {item["id"][:8]}... confidenceScore MISSING (was overwritten)')
        fail += 1
    elif row[2] == 0:
        print(f'   ✗ {item["id"][:8]}... verification findings MISSING (was overwritten)')
        fail += 1
    elif row[3] == 0:
        print(f'   ✗ {item["id"][:8]}... checklists MISSING (was overwritten)')
        fail += 1
    else:
        print(f'   ✓ {item["id"][:8]}... status=SUBMITTED confidence={row[1]} findings={row[2]} checklists={row[3]}')
        success += 1

print(f'\n✅ Result: {success}/{len(snapshot)} passed, {fail}/{len(snapshot)} failed')
conn.close()