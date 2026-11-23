import data from "./generated/kb.json";
import type { KB } from "./engine/types";
export const kb = data as unknown as KB;
export const ingById = new Map(kb.ingredients.map((i) => [i.id, i]));
