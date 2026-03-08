import py_compile
import glob

files = glob.glob('backend/app/modules/support/*.py') + ['backend/app/main.py', 'backend/app/core/database.py']
for f in files:
    try:
        py_compile.compile(f, doraise=True)
    except Exception as e:
        print("ERROR IN FILE:", f)
        print(e)
