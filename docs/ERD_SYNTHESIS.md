# Visual ER Diagram Generation

SchemaVault parses SQL DDL and outputs Mermaid `erDiagram` syntax automatically:
```mermaid
erDiagram
  users ||--o{ orders : "places"
```
