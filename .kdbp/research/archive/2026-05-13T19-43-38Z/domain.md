# Domain Research

Generated: 2026-05-12

## Scope

Standard `/gabe-scope` research lane: domain. Focused on Chilean consumer-credit
review, not broad legal-document automation.

## Findings

Chile already has consumer-facing information and tools for understanding credit,
but they are fragmented across educational pages, simulators, law text, and
provider documents. The product opportunity is not to invent credit guidance from
scratch. It is to connect a user's actual documents and case context to the
specific facts that official sources already say matter.

CMF frames consumer credit as a money loan repaid over time through installments
or another payment arrangement, and it emphasizes evaluating whether the debt is
needed, whether the borrower can pay, and what costs/benefits the product offers.
That supports treating the case context as part of the analysis, not only the PDF.

CMF also explicitly recommends quoting and comparing before contracting a bank
product. This aligns with the before-signing path: market comparison is most
valuable before the user is locked into the contract.

Credit comparison has known official concepts:

- final credit cost
- CAE
- commissions and interest structure
- associated expenses
- insurance and whether it can be contracted elsewhere
- quote/offer comparability

SERNAC's financial-consumer material maps cleanly to product checks. Before
contracting, the user has rights around quote validity and objective conditions.
When contracting, SERNAC highlights total credit cost, CAE, liquidation, summary
sheets in adhesion contracts/quotes, breakdown of charges, bundled products,
periodic information, and payment-method limitations.

## Product Implications

- V0 should treat official Chilean concepts as named fields and checks, not as
  prose-only explanation.
- The app should distinguish before-signing from after-signing. Before signing,
  compare alternatives and generate questions. After signing, focus on mismatch,
  evidence, information requests, and escalation.
- "Market alternative" should remain bounded: a few comparable options or ranges,
  not a marketplace.
- The system should show source confidence and warn when a comparison is only
  approximate, because CMF notes that simulations often use principal elements
  and real bank values depend on personal and operational factors.
- SERNAC and CMF should be treated as rule/source catalogs for v0, with exact
  source snapshots/version dates captured when implemented.

## Sources

- CMF Educa, "Credito de Consumo": https://www.cmfchile.cl/educa/621/w3-propertyvalue-43579.html
- CMF Educa, "Credito Universal": https://www.cmfchile.cl/educa/621/w3-article-27421.html
- CMF Educa, "Simuladores": https://www.cmfchile.cl/educa/621/w3-propertyvalue-44674.html
- CMF Educa, "Es posible simular una operacion bancaria?": https://www.cmfchile.cl/educa/621/w3-article-27362.html
- SERNAC, "Derechos del consumidor financiero": https://www.sernac.cl/portal/618/w3-propertyvalue-27777.html
- Biblioteca del Congreso Nacional, Ley 19.496: https://nuevo.leychile.cl/navegar?idNorma=61438
