from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def dist_dir(tmp_path: Path) -> Path:
    dist = tmp_path / "dist"
    dist.mkdir()
    assets = dist / "assets"
    assets.mkdir()
    (assets / "index-abc123.js").write_text("console.log('app')")
    (dist / "index.html").write_text("<!doctype html><html></html>")
    return dist


def test_spa_serves_index_html(dist_dir: Path) -> None:
    with patch("api.main._DIST_DIR", dist_dir):
        from api.main import create_app

        app = create_app()
        client = TestClient(app)
        resp = client.get("/some/unknown/route")
        assert resp.status_code == 200
        assert "<!doctype html>" in resp.text


def test_spa_serves_static_asset(dist_dir: Path) -> None:
    with patch("api.main._DIST_DIR", dist_dir):
        from api.main import create_app

        app = create_app()
        client = TestClient(app)
        resp = client.get("/assets/index-abc123.js")
        assert resp.status_code == 200
        assert "console.log" in resp.text


def test_spa_blocks_path_traversal(dist_dir: Path) -> None:
    secret = dist_dir.parent / "secret.txt"
    secret.write_text("sensitive")
    with patch("api.main._DIST_DIR", dist_dir):
        from api.main import create_app

        app = create_app()
        client = TestClient(app)
        resp = client.get("/../secret.txt")
        assert resp.status_code == 200
        assert "<!doctype html>" in resp.text
        assert "sensitive" not in resp.text
