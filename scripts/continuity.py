"""Continuidade local: captura arquivos, extrai e verifica hashes sem sobrescrever o projeto."""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CHECKPOINTS = ROOT / '.checkpoints'
EXCLUDED = {'node_modules', '.git', '.checkpoints', '__pycache__', 'coverage'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify(folder):
    manifest = json.loads((folder / 'manifest.json').read_text())
    with tempfile.TemporaryDirectory(prefix='minecoord-restore-') as temp:
        target = Path(temp)
        with zipfile.ZipFile(folder / 'source.zip') as archive:
            if set(archive.namelist()) != set(manifest):
                raise ValueError('Inventário do checkpoint diverge do manifesto')
            for name in archive.namelist():
                if not (target / name).resolve().is_relative_to(target.resolve()):
                    raise ValueError('Caminho inválido no checkpoint')
            archive.extractall(target)
        for name, expected in manifest.items():
            if digest((target / name).read_bytes()) != expected:
                raise ValueError(f'Hash divergente: {name}')
        for name in ['data/coordenadas.json', 'data/coordenadas.backup.json']:
            if name in manifest and not isinstance(json.loads((target / name).read_text()), list):
                raise ValueError(f'Dados inválidos: {name}')
    print(f'Restauração temporária verificada: {len(manifest)} arquivos em {folder.name}')


def checkpoint():
    CHECKPOINTS.mkdir(mode=0o700, exist_ok=True)
    name = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    pending = CHECKPOINTS / ('.pending-' + name)
    pending.mkdir(mode=0o700)
    manifest = {}
    with zipfile.ZipFile(pending / 'source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for item in sorted(ROOT.rglob('*')):
            relative = item.relative_to(ROOT)
            if any(part in EXCLUDED for part in relative.parts) or item.is_symlink() or not item.is_file():
                continue
            if item.name.startswith('.env') and item.name != '.env.example':
                continue
            data = item.read_bytes()
            archive.writestr(relative.as_posix(), data)
            manifest[relative.as_posix()] = digest(data)
    (pending / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for item in pending.iterdir():
        item.chmod(0o600)
    verify(pending)
    final = CHECKPOINTS / name
    pending.rename(final)
    pointer = CHECKPOINTS / '.latest.tmp'
    pointer.write_text(json.dumps({'checkpoint': name}) + '\n')
    pointer.chmod(0o600)
    pointer.replace(CHECKPOINTS / 'latest.json')
    print(f'Checkpoint local concluído: {final}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['retomar', 'encerrar', 'verificar'])
    args = parser.parse_args()
    if args.action == 'encerrar':
        checkpoint()
    elif args.action == 'verificar':
        name = json.loads((CHECKPOINTS / 'latest.json').read_text())['checkpoint']
        if Path(name).name != name:
            raise ValueError('Identificador inválido')
        verify(CHECKPOINTS / name)
    else:
        print(f'Projeto: {ROOT}\nDependências presentes: {(ROOT / "node_modules/express").is_dir()}')
        for name in ['coordenadas.json', 'coordenadas.backup.json']:
            file = ROOT / 'data' / name
            if file.exists():
                entries = json.loads(file.read_text())
                if not isinstance(entries, list):
                    raise ValueError(f'{name} deve conter uma lista')
                print(f'{name}: {len(entries)} registros')
        latest = CHECKPOINTS / 'latest.json'
        print(f'Último checkpoint: {latest.read_text().strip() if latest.exists() else "ausente"}')
        print('Consulte docs/CURRENT_STATE.md e docs/PROJECT_MEMORY.md.')


if __name__ == '__main__':
    main()
