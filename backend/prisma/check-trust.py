import sqlite3
conn = sqlite3.connect('prisma/dev.db')

print('=== TRUST SCORE INVESTIGATION ===\n')

# 1. Check TrustScore table
ts_count = conn.execute('SELECT COUNT(*) FROM TrustScore').fetchone()[0]
print(f'TrustScore records: {ts_count}')

if ts_count > 0:
    print('\nSample TrustScores:')
    for r in conn.execute('SELECT id, inspectorId, score, totalInspections, flaggedInspections FROM TrustScore LIMIT 10').fetchall():
        print(f'   id={r[0][:8]}... inspectorId={r[1][:8]}... score={r[2]} total={r[3]} flagged={r[4]}')
    
    # Check how many inspectors have trust scores
    with_ts = conn.execute('SELECT COUNT(DISTINCT inspectorId) FROM TrustScore').fetchone()[0]
    print(f'\nInspectors WITH trust score: {with_ts}')
else:
    print('   (table is empty)')

# 2. Check TrustHistory table
th_count = conn.execute('SELECT COUNT(*) FROM TrustHistory').fetchone()[0]
print(f'\nTrustHistory records: {th_count}')

# 3. Total inspectors
total_insp = conn.execute("SELECT COUNT(*) FROM User WHERE role='INSPECTOR'").fetchone()[0]
print(f'\nTotal inspectors in User table: {total_insp}')

# 4. Inspectors in Food Safety dept (User 801 Reddy's scope)
fs_insp = conn.execute("SELECT COUNT(*) FROM User WHERE role='INSPECTOR' AND departmentId='a338e2f8-957f-46aa-8d6e-5d00ffabcfda'").fetchone()[0]
print(f'Inspectors in Food Safety dept: {fs_insp}')

# 5. Food Safety inspectors WITH trust scores
fs_with_ts = conn.execute("""
    SELECT COUNT(*) FROM User u 
    JOIN TrustScore ts ON ts.inspectorId = u.id 
    WHERE u.role='INSPECTOR' AND u.departmentId='a338e2f8-957f-46aa-8d6e-5d00ffabcfda'
""").fetchone()[0]
print(f'Food Safety inspectors WITH trust score: {fs_with_ts}')

# 6. Check the /trust endpoint query: it fetches inspectors + trustScore
# For User 801 Reddy (deptId = Food Safety), the query is:
#   User.findMany({ where: { role: 'INSPECTOR', departmentId: 'Food Safety' }, include: { trustScore: true } })
# Let's simulate that
print('\nSimulating GET /api/supervisor/trust for User 801 Reddy:')
inspectors = conn.execute("""
    SELECT u.id, u.name, u.email, ts.score, ts.id as ts_id
    FROM User u
    LEFT JOIN TrustScore ts ON ts.inspectorId = u.id
    WHERE u.role='INSPECTOR' AND u.departmentId='a338e2f8-957f-46aa-8d6e-5d00ffabcfda'
    LIMIT 10
""").fetchall()
for r in inspectors:
    ts_id = r[4] if r[4] else 'NULL'
    score = r[3] if r[3] is not None else 'NULL'
    print(f'   {r[0][:8]}... {r[1]:20s} trustScore.id={ts_id} score={score}')

conn.close()