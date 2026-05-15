from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_cors_origins
from api.routes import cases, documents, health


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
    return app


app = create_app()
