import unittest
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.utils.network_utils import random_free_port, random_name, random_port

class TestNetworkUtils(unittest.TestCase):
    def test_random_free_port(self):
        port = random_free_port()
        self.assertIsInstance(port, int)
        self.assertGreater(port, 0)

    def test_random_name(self):
        name = random_name()
        self.assertIsInstance(name, str)
        self.assertEqual(len(name), 6)
        # Should be alphanumeric
        self.assertRegex(name, '^[a-z0-9]{6}$')

    def test_random_port(self):
        port = random_port()
        self.assertIsInstance(port, int)
        self.assertGreaterEqual(port, 2000)
        self.assertLessEqual(port, 9000)

if __name__ == '__main__':
    unittest.main()