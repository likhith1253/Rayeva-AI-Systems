import ast, glob
files = glob.glob('backend/app/modules/support/*.py') + ['backend/app/main.py', 'backend/app/core/database.py']
for f in files:
    try:
        ast.parse(open(f, encoding='utf-8').read(), filename=f)
    except SyntaxError as e:
        print("SYNTAX ERROR IN:", e.filename, "LINE:", e.lineno)
        print("TEXT:", repr(e.text))
