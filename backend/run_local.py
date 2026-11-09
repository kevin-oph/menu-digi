"""Desarrollo exclusivamente en loopback con SQLite; Docker usa PostgreSQL."""
import argparse
import os
import sys
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--dependencies',type=Path)
parser.add_argument('--state',type=Path,required=True)
parser.add_argument('--port',type=int,default=8000)
args=parser.parse_args()
if args.dependencies:
    sys.path.insert(0,str(args.dependencies.resolve()))
env=Path(__file__).parent.parent/'.env'
if not env.exists():
    raise SystemExit('Ejecuta primero node scripts/configure-local.mjs desde la carpeta del proyecto.')
for line in env.read_text(encoding='utf-8').splitlines():
    if line and not line.startswith('#') and '=' in line:
        key,value=line.split('=',1)
        if key in {'APP_SECRET','ADMIN_TOKEN'}:
            os.environ[key]=value
state=args.state.resolve();state.mkdir(parents=True,exist_ok=True)
os.environ['DATABASE_URL']='sqlite+aiosqlite:///'+(state/'pizzetas.db').as_posix()
os.environ['MEDIA_ROOT']=str(state/'media')
sys.path.insert(0,str(Path(__file__).parent.resolve()))
import uvicorn
from app.api import app
print(f'API local: http://127.0.0.1:{args.port}/api/docs',flush=True)
uvicorn.run(app,host='127.0.0.1',port=args.port,log_level='warning')
