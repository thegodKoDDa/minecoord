import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('continuity', Path(__file__).with_name('continuity.py'))
continuity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(continuity)


class ContinuityTests(unittest.TestCase):
    def test_checkpoint_restores_and_excludes_private_config_and_generated(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            (root / 'data/coordenadas.json').write_text('[{"id":"legacy"}]')
            (root / 'README.md').write_text('source')
            (root / '.env').write_text('PRIVATE=value')
            (root / '.env.example').write_text('PORT=3000')
            for name in ['node_modules', '.artifacts', '.git']:
                (root / name).mkdir()
                (root / name / 'excluded').write_text('generated')
            (root / 'linked.env').symlink_to(root / '.env')
            with patch.object(continuity, 'ROOT', root), patch.object(continuity, 'CHECKPOINTS', root / '.checkpoints'), contextlib.redirect_stdout(io.StringIO()):
                continuity.checkpoint()
                name = json.loads((root / '.checkpoints/latest.json').read_text())['checkpoint']
                self.assertRegex(name, r'^\d{8}T\d{12}Z$')
                point = root / '.checkpoints' / name
                continuity.verify(point)
                manifest = json.loads((point / 'manifest.json').read_text())
                self.assertEqual(set(manifest), {'README.md', '.env.example', 'data/coordenadas.json'})
                with zipfile.ZipFile(point / 'source.zip', 'w') as archive:
                    for file in manifest:
                        archive.writestr(file, 'changed')
                with self.assertRaises(ValueError):
                    continuity.verify(point)

    def test_failed_checkpoint_preserves_previous_pointer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            (root / 'data/coordenadas.json').write_text('[]')
            with patch.object(continuity, 'ROOT', root), patch.object(continuity, 'CHECKPOINTS', root / '.checkpoints'), contextlib.redirect_stdout(io.StringIO()):
                continuity.checkpoint()
                pointer = (root / '.checkpoints/latest.json').read_bytes()
                (root / 'data/coordenadas.json').write_text('{invalid')
                with self.assertRaises(ValueError):
                    continuity.checkpoint()
                self.assertEqual((root / '.checkpoints/latest.json').read_bytes(), pointer)

    def test_restore_rejects_paths_outside_temporary_folder(self):
        with tempfile.TemporaryDirectory() as directory:
            point = Path(directory)
            (point / 'manifest.json').write_text(json.dumps({'../escape': continuity.digest(b'escape')}))
            with zipfile.ZipFile(point / 'source.zip', 'w') as archive:
                archive.writestr('../escape', 'escape')
            with self.assertRaisesRegex(ValueError, 'Caminho inválido'):
                continuity.verify(point)


if __name__ == '__main__':
    unittest.main()
