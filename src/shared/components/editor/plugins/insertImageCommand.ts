import { createCommand } from "lexical";

export interface InsertImagePayload {
  src: string;
  altText: string;
}

export const INSERT_IMAGE_COMMAND =
  createCommand<InsertImagePayload>("INSERT_IMAGE_COMMAND");
