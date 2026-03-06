"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const natural_1 = __importDefault(require("natural"));
class AIPersonalization {
    constructor(query) {
        this.query = query;
        this.tokenizer = new natural_1.default.WordTokenizer();
    }
    // Compute AI relevance scores for posts
    computeRelevance(posts) {
        const queryTokens = this.preprocessText(this.query);
        return posts.map((post) => {
            const postTokens = this.preprocessText(post.content);
            return this.calculateSimilarity(queryTokens, postTokens);
        });
    }
    // Preprocess text: tokenize, lowercase, and stem
    preprocessText(text) {
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const stemmer = natural_1.default.PorterStemmer;
        return tokens.map((token) => stemmer.stem(token));
    }
    // Similarity calculation: Jaccard Similarity
    calculateSimilarity(tokensA, tokensB) {
        const setA = new Set(tokensA);
        const setB = new Set(tokensB);
        const intersection = [...setA].filter((token) => setB.has(token)).length;
        const union = new Set([...setA, ...setB]).size;
        return union === 0 ? 0 : intersection / union;
    }
}
exports.default = AIPersonalization;
