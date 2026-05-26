from __future__ import annotations

from api.config import ConsumerCreditAgentSettings
from api.services.consumer_credit_provider import (
    ConsumerCreditAgentInput,
    ConsumerCreditProviderResult,
    get_consumer_credit_provider,
)


class ConsumerCreditAgent:
    """Structured consumer-credit analysis agent.

    Consumes confirmed facts, deterministic calculation results, and
    selected reference keys. Returns the full ConsumerCreditAnalysis
    shape through a provider that enforces structured output.
    """

    def __init__(self, settings: ConsumerCreditAgentSettings) -> None:
        self.settings = settings
        self.provider = get_consumer_credit_provider(settings)

    def analyze(
        self,
        *,
        agent_input: ConsumerCreditAgentInput,
    ) -> ConsumerCreditProviderResult:
        return self.provider.analyze(
            agent_input=agent_input,
            settings=self.settings,
        )
