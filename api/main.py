from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.config import get_cors_origins
from api.routes import analysis, cases, documents, export, facts, health, receptionist

_DIST_DIR = Path(__file__).resolve().parent.parent / "dist"


def create_app() -> FastAPI:
    app = FastAPI(title="nmkgn API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix="/api")
    app.include_router(cases.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(facts.router, prefix="/api")
    app.include_router(receptionist.router, prefix="/api")
    app.include_router(analysis.router, prefix="/api")
    app.include_router(export.router, prefix="/api")

    if _DIST_DIR.is_dir():
        assets_dir = _DIST_DIR / "assets"
        if assets_dir.is_dir():
            app.mount(
                "/assets", StaticFiles(directory=str(assets_dir)), name="static-assets"
            )

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str) -> FileResponse:
            file_path = _DIST_DIR / full_path
            if (
                full_path
                and file_path.is_file()
                and _DIST_DIR in file_path.resolve().parents
            ):
                return FileResponse(str(file_path))
            return FileResponse(str(_DIST_DIR / "index.html"))

    return app


app = create_app()
