from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in kitchen_module/__init__.py
from kitchen_module import __version__ as version

setup(
	name="kitchen_module",
	version=version,
	description="Manufacturing of foods",
	author="SMB",
	author_email="usamanaveed9263@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
