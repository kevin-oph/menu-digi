"""Exportar el esquema inicial PostgreSQL sin conectarse a una base de datos."""
import argparse
import sys
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--dependencies',type=Path)
args=parser.parse_args()
if args.dependencies:
    sys.path.insert(0,str(args.dependencies.resolve()))
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateIndex, CreateTable
from app.models import Base
dialect=postgresql.dialect()
statements=['-- Esquema inicial v1. No es una migración de bases ya existentes.\nBEGIN;']
for table in Base.metadata.sorted_tables:
    statements.append(str(CreateTable(table,if_not_exists=True).compile(dialect=dialect))+';')
    for index in table.indexes:
        statements.append(str(CreateIndex(index,if_not_exists=True).compile(dialect=dialect))+';')
statements += ['INSERT INTO schema_revision (id) VALUES (1) ON CONFLICT DO NOTHING;', 'COMMIT;']
Path(__file__).with_name('init.sql').write_text('\n\n'.join(statements)+'\n',encoding='utf-8')
print('Esquema inicial PostgreSQL exportado. Ejecución contra PostgreSQL pendiente.')
