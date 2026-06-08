"""Installer for the plone.patternslib package."""

from setuptools import setup

long_description = "\n\n".join(
    [
        open("README.md").read(),
        open("CHANGES.md").read(),
    ]
)


setup(
    name="plone.patternslib",
    version="9.10.6",
    description="An add-on to make Patternslib available to Plone.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    # See https://pypi.org/classifiers/
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Environment :: Web Environment",
        "Framework :: Plone",
        "Framework :: Plone :: 6.0",
        "Framework :: Plone :: 6.1",
        "Framework :: Plone :: 6.2",
        "Framework :: Plone :: 6.3",
        "Framework :: Plone :: Addon",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "Programming Language :: Python :: 3.14",
        "Operating System :: OS Independent",
    ],
    keywords="Python Plone Patternslib",
    author="Syslab.com",
    author_email="devel@syslab.com",
    url="https://github.com/plone/plone.patternslib",
    license="GPL-2.0-only",
    include_package_data=True,
    zip_safe=False,
    python_requires=">=3.9",
    install_requires=[
        "Products.CMFPlone",
        "Products.GenericSetup",
        "zope.interface",
    ],
    extras_require={
        "test": [
            "plone.api",
            "plone.app.testing",
            "plone.base",
        ],
    },
    entry_points="""
    [z3c.autoinclude.plugin]
    target = plone
    """,
)
