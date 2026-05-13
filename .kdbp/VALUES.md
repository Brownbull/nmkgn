# Project Values

- **V1 - One Document Type First:** Prove Chilean consumer-credit review end to end before expanding into leases, insurance, employment contracts, or other document classes. `epic`
- **V2 - Stable Schema Per Document:** Each document type has fixed Pydantic input/output models; user display choices never change the agent's output shape. `story`
- **V3 - Evidence Before Advice:** Every finding must cite a clause, calculation, benchmark, or user-provided comparison before it can guide the user. `story`
- **V4 - Confirm Before Concluding:** Uncertain extracted facts must be visible and confirmable before the app treats them as analysis inputs. `story`
- **V5 - No Dead Air:** Any analysis step over five seconds must show real progress and current work state. `story`
- **V6 - Route By Task Cost:** Use cheaper classification/extraction paths and reserve expensive reasoning for findings that need it; never expose model choice to users. `story`
- **V7 - Measure Every Run:** Track cost, latency, token use, extraction confidence, and analysis duration for each case pipeline run. `story`
- **V8 - Provenance Or It Is Not A Finding:** A user-visible claim is either a sourced fact with coordinates/link and dates, an AI inference with model/date/evidence metadata, or an unsupported output kept only for audit/debugging. `story`
