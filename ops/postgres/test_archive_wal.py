import importlib.util, os, tempfile, unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('archive_wal', Path(__file__).with_name('archive-wal.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.root = Path(self.temp.name)
        self.dest = self.root/'archive'; self.dest.mkdir(mode=0o700)
        self.source = self.root/'000000010000000000000001'; self.source.write_bytes(b'original-wal')
    def tearDown(self): self.temp.cleanup()
    def test_repeated_identical_archive(self):
        for _ in range(2): module.archive(self.source,self.dest,self.source.name)
        self.assertEqual((self.dest/self.source.name).read_bytes(),b'original-wal')
        self.assertEqual(len(list(self.dest.iterdir())),1)
    def test_conflict_never_overwrites(self):
        (self.dest/self.source.name).write_bytes(b'retained-original')
        with self.assertRaises(ValueError): module.archive(self.source,self.dest,self.source.name)
        self.assertEqual((self.dest/self.source.name).read_bytes(),b'retained-original')
    def test_symlink_is_rejected(self):
        original=self.root/'original';original.write_bytes(b'retained')
        (self.dest/self.source.name).symlink_to(original)
        with self.assertRaises(OSError): module.archive(self.source,self.dest,self.source.name)
        self.assertEqual(original.read_bytes(),b'retained')
    def test_public_archive_and_traversal_rejected(self):
        os.chmod(self.dest,0o755)
        with self.assertRaises(ValueError):module.archive(self.source,self.dest,self.source.name)
        os.chmod(self.dest,0o700)
        with self.assertRaises(ValueError):module.archive(self.source,self.dest,'../escape')
        self.assertEqual(list(self.dest.iterdir()),[])
    def test_failed_publication_keeps_original_and_removes_only_own_temp(self):
        retained=self.dest/'.pending-retained';retained.write_bytes(b'retained')
        (self.dest/self.source.name).mkdir()
        with self.assertRaises((OSError,ValueError)):module.archive(self.source,self.dest,self.source.name)
        self.assertEqual(retained.read_bytes(),b'retained')
        self.assertEqual(len(list(self.dest.iterdir())),2)
if __name__=='__main__':unittest.main()
