import sqlite3
c = sqlite3.connect('dev.db')
c.execute("DELETE FROM conversations")
c.execute("DELETE FROM escalation_logs")
c.commit()
print("Database cleaned for fresh tests")
