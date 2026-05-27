from __future__ import annotations

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from api.models.base import Base


def _engine(tmp_path, name: str = "test.db"):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / name}")

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_conn, _connection_record):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    return engine


@pytest.fixture()
def session(tmp_path):
    engine = _engine(tmp_path)
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s
