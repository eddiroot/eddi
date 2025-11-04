import { PGVectorStore, type DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { pool } from "../../db/index";
import { defaultEmbeddings } from "../embeddings";

export interface VectorStoreConfig {
  collectionName: string;
}

export async function createVectorStore(config: VectorStoreConfig) {
    return await PGVectorStore.initialize(defaultEmbeddings, {
        pool,
        tableName: "vector_embeddings",
        collectionName: config.collectionName,
        columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
        },
        distanceStrategy: "cosine" as DistanceStrategy,
    });
}