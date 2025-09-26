import { Embeddings } from "@langchain/core/embeddings";

export class NomicEmbeddings extends Embeddings {
  private apiKey: string;
  private model: string = "nomic-embed-text-v1.5";
  private baseUrl: string = "https://api-atlas.nomic.ai/v1";

  constructor(config?: { apiKey?: string; model?: string }) {
    super({});
    this.apiKey = config?.apiKey || process.env.NOMIC_API_KEY!;
    this.model = config?.model || this.model;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embedding/text`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        texts: documents,
        task_type: "search_document"
      })
    });

    if (!response.ok) {
      throw new Error(`Nomic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embedding/text`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        texts: [query],
        task_type: "search_query"
      })
    });

    if (!response.ok) {
      throw new Error(`Nomic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  }
}

