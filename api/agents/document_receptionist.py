from __future__ import annotations

from api.config import ReceptionistSettings
from api.models.document import Document
from api.services.receptionist_media import DocumentMediaBundle
from api.services.receptionist_provider import (
    ReceptionistProviderResult,
    get_receptionist_provider,
)


class DocumentReceptionistAgent:
    """Narrow raw-document reviewer that returns structured observations only."""

    def __init__(self, settings: ReceptionistSettings) -> None:
        self.settings = settings
        self.provider = get_receptionist_provider(settings)

    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
    ) -> ReceptionistProviderResult:
        return self.provider.review_document(
            document=document,
            media_bundle=media_bundle,
            settings=self.settings,
        )
